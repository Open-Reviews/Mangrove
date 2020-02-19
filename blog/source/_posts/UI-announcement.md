---
title: UI announcement
date: 2020-02-19 09:38:18
tags:
---
# Mangrove Beta Release: a Web App for Open Reviews

***We built a service for online reviews that makes the insights you share accessible across any application, and that does not invade your privacy. Leave proprietary data silos behind and enter the open data ecosystem of Mangrove reviews.***

Our goal for this blog post is to show you around in the newly released Mangrove web app: this is a brief summary of its capabilities at a glance. 


This web app is one building block of a larger vision. **One way to make value creation on the internet more inclusive, and to allow more people to participate in economic growth, is to make more data openly accessible.** If we are able to create attractive open alternatives to proprietary services based on data that is in the public domain, we can reduce the dominance of information monopolists and our growing dependence on them. Stay tuned for upcoming blog posts where we share our vision for creating an open data ecosystem for reviews in order to achieve the scale at which we can speak of a true alternative to closed, exploitative systems.

So, what can the Mangrove web app do for you? In brief, it lets you read and write reviews! **But what’s different to the well-known proprietary services out there?**

1. **You can read/write reviews for many things that matter to people, all in one place.** These things are currently: places on the map such as restaurants, hotels, touristic sites; but also companies, websites, and books. In Mangrove you can share with people a wider range of your experiences if you like, all in one profile. 
2. **The valuable insight you share with others is in the public domain** where it can be useful to more people than proprietary services allow, because the data can be integrated into a variety of applications and websites freely. While proprietary data silos allow only their own registered users to write reviews or consume the data, an open dataset can be a source for entrepreneurial activity, open innovation, and better decision-making on a larger scale.
3. **Read/write reviews without being exploited for your personal information.** We are strong advocates for privacy, and we developed a way to create accounts without requiring registration. You don’t need to entrust yet another service with your name, email, birth date, address, etc.. And the Mangrove web app and website don’t have any trackers, third-party cookies, ads; we don’t even use any analytics on the page to not invade your privacy. You share any information consciously and voluntarily, directly with the public domain.

Now, let's explore it! 

Start your tour of Mangrove by entering something you are looking for into the search box. This can be the restaurant where you ate last night, or a website you love and really want to recommend ...or a book worth sharing your thoughts about.

## Search

[![](https://i.imgur.com/qK0vJod.png)](https://mangrove.reviews)

Let’s try “Bürgenstock”, a picturesque little settlement and touristic spot on a hill above Lake Lucerne that we’ve recently visited.

Press enter, and the Results page appears. On the left you will see a list of subjects from different categories that are related to your search word. For “Bürgenstock” there are places, companies and books coming up. You can use the category filters to display only the relevant results, in this case “Places”.

![](https://i.imgur.com/IbjUsTU.png)

Once you click on the subject of your interest, you will see on the right its details and all reviews that have been submitted for it. If it’s a place, you will also see its location on the map. You can use the map to navigate to a different place and select that instead.

![](https://i.imgur.com/m1spvyd.jpg)

Each of the categories that can be reviewed draw their identifiers from other open datasets. Places for instance use OpenStreetMap to identify a point of interest or geographic location. For books we use ISBN via the Open Library. For companies we use the Legal Entity Identifier provided by GLEIF. Websites are identified by their URL.

Now, let’s share some experiences and insights - where if not here, in the public domain, where it belongs to humanity as a whole and is not part of just one corporate’s data treasure trove that can be sold off or shut down at the whim of its owners.

## Writing a review

Clicking the “Write a review” button opens the review form. It is slightly different for each category. Let’s look at one for books. What should be familiar from proprietary services are the stars, the text box to describe your experience, as well as the “I agree to the Terms of Service” confirmation. 

![](https://i.imgur.com/o1k4Nzj.png)

What is, however, significantly different is that in Mangrove you are in full control of what information you share about yourself. 

## Privacy, literally

In today’s dominant proprietary review services you share one type of information openly on the platform for other users to see. That’s the voluntary part. But you share a whole lot more information in the background. While being logged in on the platform, you are exposed to trackers, and first and third-party cookies that record your search and browsing history, as well as your online behavior to determine predictive patterns that make you an easier target for advertising and political campaigns. 

This data is shared across a plethora of intertwined parties with contractual relationships that are practically impossible to dissect. Harvard Professor Shoshana Zuboff, the author of the best-selling book 'The Age of Surveillance Capitalism’, has called this a 'form of tyranny that feeds on people but is not of the people'.

Our approach is different. **In Mangrove, there is just one type of information shared by users: the one entered consciously and voluntarily in the review form.** Once submitted, it goes directly into the open dataset, with no intermediary collecting anything in the background.

The dataset is open for everyone to inspect, and the whole code base of Mangrove, comprising [the standard, the server, the user interface](https://gitlab.com/plantingspace/mangrove), as well as the [APIs](https://docs.mangrove.reviews) and the [JS client library](https://js.mangrove.reviews), are open source and allow for scrutiny by the community to ensure that it does what it promises.

## Account, redefined

In a reviews system, identity and reputation play an important role in ensuring reliable ratings. To allow for persistent identity while ensuring high privacy standards we introduced a new way for users to create their identity. It does not require any central party to keep track of it. Users interact directly with the database. 

Mangrove leverages public-key cryptography to enable that. The user's device generates a secure password (a cryptographic private key), allowing them to write reviews under a unique identifier (symbolized by an avatar), and to authenticate themselves as its rightful owner. This mechanism does not require any intermediaries. Simply saving the private key, ideally in a password manager, and re-entering it in case the browser’s local storage was erased, allows users to access their account at all times, from any device.

![](https://i.imgur.com/XHeFRPO.png)

The aggregation algorithm that computes ratings based on individual reviews gives higher weight to reviewers with a good reputation, i.e., a track record of high-quality reviews. Reputation is built by a number of things, such as contributing regularly reviews that display a differentiated assessment, by other users marking reviews as “useful” or “confirming” the reviews as matching with their own experience, or by providing proofs of purchase (e.g., pictures, scans of bills). 

Reputation is diminished in cases where users flag a review as inappropriate, or if a reviewer displays behavior that violates the Terms of Service.

Reviews can also be commented on or replied to by other users. This is particularly interesting for owners of businesses or websites interacting with their customers, as well as authors replying to readers.

## Build on Mangrove

This open-source infrastructure is built for integration. Ultimately, we’ve got to build successful ecosystems around open data to get to the scale at which we can speak of true alternatives to closed, exploitative systems.

Check out how you can [integrate Mangrove](https://mangrove.reviews/build) into your application or website, and stay tuned for a dedicated blog post about this topic.

## Contribute

Mangrove is a non-profit service hosted and supported by a community of businesses, developers and interested parties around the world. You can support this project by spreading the word and letting others know of its existence. If you are using apps or websites that could benefit from a reviews layer (any navigation map alternative to Google Maps, tourism websites, online libraries, and many more), please get in touch with us or with them directly to let them know. 

And finally, financial sponsorships and donations help us to get more reach and grow the ecosystem. All finances of the project are managed transparently in the [Mangrove Open Collective](https://opencollective.com/mangrove).

## Get in touch

Twitter: @mangroveReviews   
Mastodon: @mangroveReviews@mas.to    
LinkedIn: [PlantingSpace](https://www.linkedin.com/company/plantingspace)    
Email: mangrove@planting.space    
Website: [mangrove.reviews](https://mangrove.reviews)     
