# Networth MAP

A guided financial assessment with Financial Review and Money Huddle coaching.

**Live product:** https://lovely-lapwing-356.convex.site/

Reviewers can use **Google Login** with their own account, then choose **Build My Networth MAP**. Temporary evaluator access is subject to availability and admission limits.

## Product documentation

- [Product vision and scope](PRODUCT.md)
- [User experience and design](DESIGN.md)
- [Architecture and implementation](TECH.md)

## Stack

React and Vite for the interface; Convex for backend functions, database, authentication and static hosting.

## Local development

```sh
npm ci
```

Configure your own Convex development project and authentication credentials in an untracked `.env.local`. Production credentials and private test evidence are excluded from this repository.

```sh
npm run dev
```

For the disposable local test interface with scripted backend responses:

```sh
npm run dev:test
```

## Checks

```sh
npm test
npm run typecheck
npm run build
```

## Deployment

Deployment uses `npm run deploy` with authorized Convex access. A Git push does not deploy the application. Do not change or deploy a production environment without its owner's approval.

## Privacy and evidence

Do not commit credentials, real financial profiles, session tokens or raw production logs. Automated and synthetic tests are not real-user research. Local validation reports and screenshots may be referenced by documentation but are intentionally excluded from this public repository.
