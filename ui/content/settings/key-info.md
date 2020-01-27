---
title: "How to manage your identity in Mangrove"
---

Mangrove uses public-key cryptography to authenticate a reviewer, which allows us to get rid of registrations and logins, and makes storing user’s personal information obsolete. 

Public-key cryptography uses pairs of keys: public keys which may be disseminated widely, and private keys which are known only to the owner. Both are generated in your browser when you access Mangrove, and are stored locally in a temporary storage (IndexedDB). 

The **public key** represents your identifier that will be displayed with each review you write. It keeps track of your reputation and is part of ensuring the reliability of the aggregated ratings, as the aggregation algorithm gives higher weight to a public key that has published many high-quality reviews.

The **private key** serves as your digital signature to authenticate you so that no one else can write reviews with your public key.

By default, a new key pair is generated each time you access Mangrove from a new device, a new browser, or after clearing your browser data. To be able to write reviews under a previously used public key, you need to have access to the respective private key. **We recommend storing it in a password manager**.
To access a previously used public key simply click the “Switch account” button, and import the respective private key.
