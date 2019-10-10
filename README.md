# Mangrove

[Learn more about the project.](https://planting.space/mangrove.html)

This repository contains:
- [Mangrove Review Standard](Mangrove_Review_Standard_v1.md)
- Mangrove Original Server implementation
- Mangrove Original UI implementation

## Servers

Both servers need to be up for the UI to work.

Hash always refers to SHA256.

`npm` and Rust compiler is needed:
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Nightly compiler version is used:
```
rustup default nightly
```

### Mangrove Review Server

Build the frontend:
```
cd reviewer/client
npm run build
cd ../..
```

Build and run the server.
```
cd reviewer
cargo run
```

- `PUT` a Mangrove Review as JSON to store it on the server.
- `GET` a list of Mangrove Reviews that have fields equal to query params.

### Mangrove File Server

```
cd file_hoster
cargo run
```

- `PUT` a file to `/upload` to store it on the server, get hash of the file if successful.
- `GET` a file with given hash from `/<hash>`.
