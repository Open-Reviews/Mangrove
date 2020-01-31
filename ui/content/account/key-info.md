---
title: "Advanced"
---

To authenticate a reviewer, Mangrove uses [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) instead of traditional logins. This allows us to create a system where the user doesn’t have to register and entrust yet another service with their name, email address, birth date, etc.

Throughout the user interface we have chosen more traditional terms to represent this authentication process instead of the accurate technical terms, so that it makes sense to all users. The terms used in the UI correspond to the technical terms as listed here:

* Password = private key
* Account = the cryptographic key pair with all reviews and metadata linked to it
* Login = the process of importing a previously generated private key, together with the public key that was derived from it, and all reviews linked to that public key
* Avatar = a visual representation of the public key  

<br/>
Public-key cryptography uses pairs of keys: public keys which may be disseminated widely, and private keys which are known only to the owner. Both are generated in your browser when you access Mangrove, and are stored locally in a temporary storage (IndexedDB).   
<br/>
Find below the generated keys for your current session.
