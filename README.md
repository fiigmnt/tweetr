# Tweetr
a twitter automation bot

> “Automation applied to an inefficient operation will magnify the inefficiency.” – Bill Gates

### Introduction

This bot uses a cron based github action 👇

```
on:
  schedule:
    - cron: "0 12-16 * * *"
```

The architecture is simple - an  `index`  that runs  `actions`  and reads from  `lists`.

Frameworks:

- Prisma
- Twitter API V2

### Development

`yarn start`  runs the main function -> for development testing.

`yarn build` is the build that is run by the github action.

That's it. ✨

