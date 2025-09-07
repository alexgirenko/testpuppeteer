/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url");
  const debug = searchParams.get("debug");

  // If debug mode was requested, return environment and packaging diagnostics early
  if (debug) {
    const expectedRel = path.join("node_modules", "@sparticuz", "chromium", "bin");
    const expectedAbs = path.resolve(process.cwd(), expectedRel);
    const exists = fs.existsSync(expectedAbs);
    let listing: string[] = [];
    if (exists) {
      try {
        listing = fs.readdirSync(expectedAbs);
      } catch {}
    }

    let execPath: string | null = null;
    let execErr: string | null = null;
    try {
      const chromium = (await import("@sparticuz/chromium-min")).default;
      execPath = await chromium.executablePath();
    } catch (e: any) {
      execErr = e?.message || String(e);
    }

    const payload = {
      cwd: process.cwd(),
      chromiBinExpectedRel: expectedRel,
      chromiBinExpectedAbs: expectedAbs,
      chromiBinExists: exists,
      chromiBinListing: listing,
      CHROMIUM_BIN_env: process.env.CHROMIUM_BIN ?? null,
      chromiumExecutablePath: execPath,
      chromiumExecutablePathError: execErr,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!urlParam) {
    return new NextResponse("Please provide a URL.", { status: 400 });
  }

  // Prepend http:// if missing
  let inputUrl = urlParam.trim();
  if (!/^https?:\/\//i.test(inputUrl)) {
    inputUrl = `http://${inputUrl}`;
  }

  // Validate the URL is a valid HTTP/HTTPS URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(inputUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new NextResponse("URL must start with http:// or https://", {
        status: 400,
      });
    }
  } catch {
    return new NextResponse("Invalid URL provided.", { status: 400 });
  }

  let browser;
  try {
    const isVercel = !!process.env.VERCEL_ENV;
    let puppeteer: any,
      launchOptions: any = {
        headless: true,
      };
    

    if (isVercel) {
      const chromium = (await import("@sparticuz/chromium-min")).default;
      puppeteer = await import("puppeteer-core");

      // Diagnostic: try to resolve the expected bin folder and list contents if missing.
      const expectedRel = path.join("node_modules", "@sparticuz", "chromium", "bin");
      const expectedAbs = path.resolve(process.cwd(), expectedRel);
      let execPath: string | null = null;
      try {
        execPath = await chromium.executablePath();
      } catch (e: any) {
        const exists = fs.existsSync(expectedAbs);
        let listing: string[] = [];
        if (exists) {
          try {
            listing = fs.readdirSync(expectedAbs);
          } catch {}
        }

        const diag = `chromium.executablePath() failed: ${e?.message || e}\nexpectedAbs=${expectedAbs}\nexists=${exists}\nlisting=${JSON.stringify(listing)}`;
        // Surface a more helpful error to the client for debugging deployment packaging issues.
        return new NextResponse(`Chromium packaging error: ${diag}`, { status: 500 });
      }

      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath: execPath,
      };
    } else {
      puppeteer = await import("puppeteer");
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.goto(parsedUrl.toString(), { waitUntil: "networkidle2" });
    const screenshot = await page.screenshot({ type: "png" });
    return new NextResponse(screenshot, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="screenshot.png"',
      },
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(
      "An error occurred while generating the screenshot. " + error.message,
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
