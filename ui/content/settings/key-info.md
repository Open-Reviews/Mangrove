---
title: "How to manage your identifier in Mangrove"
---

Mangrove uses public-key cryptography to authenticate a reviewer, which allows us to get rid of registrations and logins, and makes storing users’ personal information obsolete. 

Public-key cryptography uses pairs of keys: public keys which may be disseminated widely, and private keys which are known only to the owner. Both are generated in your browser when you access Mangrove, and are stored locally in a temporary storage (IndexedDB). 

The **public key** represents **your identifier** that will be displayed with each review you write. It allows you to build a reputation to make your opinion count more. This is because the algorithm that aggregates individual reviews to a final rating gives higher weight to public keys that have published many high-quality reviews. This is part of ensuring a high reliability of the ratings.

The **private key** is used to **create a digital signature to authenticate you** so that no one else can write reviews with your identifier.

By default, a new key pair is generated each time you access Mangrove from a new device, a new browser, or after clearing your browser data. To be able to write reviews under a previously used public key, you need to have access to the corresponding private key. **We recommend storing it in a password manager**.
To access a previously used public key simply click the “Switch identifier” button, and import the corresponding private key.
