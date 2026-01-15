# rd-testing

Test suite for [repo-drift](https://github.com/chrismlittle123/repo-drift) CLI tool.

## Setup

```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:scans
npm run test:integrity
npm run test:discovery
npm run test:org
npm run test:exclude

# Watch mode
npm run test:watch
```

## Documentation

See [TESTING.md](./TESTING.md) for the complete testing guide including manual tests.
