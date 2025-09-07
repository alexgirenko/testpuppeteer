This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Troubleshooting: @sparticuz/chromium on Vercel

If you see an error like "The input directory \"/var/task/node_modules/@sparticuz/chromium/bin\" does not exist. Please provide the location of the brotli files.", Vercel's serverless build needs the chromium binary files to be explicitly included in the Function bundle.

Solution included in this repo:

- Add a `vercel.json` at the project root that tells Vercel to include the `node_modules/@sparticuz/chromium/bin` folder for the API function that uses Chromium. The file in this repo includes:

```json
"functions": {
	"app/api/screenshot/**": {
		"includeFiles": [
			"node_modules/@sparticuz/chromium/bin/**"
		]
	}
}
```

Alternative approaches:

- Use the `@sparticuz/chromium` package's helper to set a custom `CHROMIUM_BIN` path if you have a different layout.
- Use the official Playwright with preinstalled browsers or a serverless-friendly helper library that bundles executables for Vercel.

