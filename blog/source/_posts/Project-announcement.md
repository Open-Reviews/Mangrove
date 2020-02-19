---
title: "Creating an Open Data Ecosystem for Reviews"
date: 2019-12-09 11:12:18
tags: Vision
excerpt: As consumer choice proliferates, people will rely even more on online reviews to inform their decisions. This makes reviews an increasingly powerful tool and valuable source of insight for individuals and businesses alike. The problem is that hundreds of millions of people are feeding their valuable insights currently into proprietary data silos of a few dominant platforms.
photos: [https://i.imgur.com/hTwTo1l.jpg]
---

![](https://i.imgur.com/hTwTo1l.jpg)

***As consumer choice proliferates, people will rely even more on online reviews to inform their decisions. This makes reviews an increasingly powerful tool and valuable source of insight for individuals and businesses alike. The problem is that hundreds of millions of people are feeding their valuable insights currently into proprietary data silos of a few dominant platforms.***

We all benefit from leveraging the experiences of others for our own decision-making. We feel an intrinsic need to share with others information about things we used and experienced, and to make use of such information ourselves before we invest resources.

The world is growing more complex, and so are the choices that we have to make each day. The number of services, products, media outlets, books, travel destinations, websites, apps, is growing, and it takes more effort to navigate the global range of offerings. We increasingly look up information online when we want to buy something or go somewhere, and we actively search for other people's opinions in order to form our own (research studies performed by [IMC](https://spiegel.medill.northwestern.edu/online-reviews/) or [BrightLocal](https://www.brightlocal.com/research/local-consumer-review-survey/) have quantified this trend).

In addition, the opinions of customers in the form of online reviews have become crucial for businesses. Online word-of-mouth impacts businesses' reputation, their ranking in search results, and ultimately their profitability, as consumers are willing to pay more for products for which reviews are available.

Companies such as Google, Yelp, Facebook, TripAdvisor, or TrustPilot have recognized this trend already years ago, and offered business listing platforms on which users could leave reviews as well as read other people's reviews for free. By now, these services boast hundreds of millions of consumer reviews in their applications. The crowd-sourced data has become a well-guarded asset for these companies, based on which they generate revenues, predominantly from advertising and sharing the personal data of their users.

## A threat to free competition

As the amount of available review data is growing, and with it the dependence of people and organizations on the insights that can be generated from it, access restriction not only stifles innovation, but locks us in even further. The opportunities arising to create new products and technologies will only be open to a few powerful organisations, threatening free market competition, and possibly even free will.

Suppose all review data was openly accessible and could be shared freely. Something like a commons, available free of charge and without restrictions to all. Think of Wikipedia, the Internet Archive, or OpenStreetMap. Assume in addition that there was a way to let people write reviews without requiring them to provide any personal data; that people could create an identity within the open reviews ecosystem that they control and that cannot be linked to their real-world identity, but that nevertheless allow the system to track reputation. 

The potential for innovation would be multiplied by orders of magnitude compared to the current state in which only a small number of engineers at aforementioned companies have access to such data, partitioned across several silos.

Imagine how it would be if people could build their reputation in a privacy-preserving manner, not influenced by their gender, their sexual preferences, or the color of their skin, but purely based on their actions within the system, by how useful millions of other users find their content.

Imagine if everyone with an interesting idea for a new mapping or navigation service could integrate a reviews layer into their map, so that people looking for “a restaurant nearby” would not all have to use Google for it, but would actually have an alternative.

Imagine more people could experiment with AI-driven recommendation services that are privacy-preserving and respectful to the user. This would allow us to use this nascent technology more safely, and more to our genuine benefit than to the benefit of advertisers. From one open dataset containing insights from hundreds of millions of people such systems could compile more accurate recommendations than what is currently possible with the information silos we have. It could also surface interesting new niche products based on genuine popularity among people or the preferences you choose to set, instead of surfacing those items that have the highest advertising budget.

Most importantly, you would not have to choose whose service you want to trust based on the size of the network they control, but you could choose the product that has the highest technological merit --- based on innovation and open access to data.

Recommendation services are already being marketed by Amazon, Google, Foursquare and others, mostly to the benefits of their advertising partners. These technologies are still in their infancy, but as they become better, people will start relying on them in order to manage complexity in their lives. Driven by pressure to generate profits combined with their reliance on advertising-based business models, we all might end up being at the mercy of closed-source algorithms that might bombard us with things to buy that we don’t need -- but can’t resist.

## Need to create alternatives

To be able to use technology in a way that actually helps us and releases creative and innovative energy, I believe that we need to rethink some of the fundamental architectures that internet services are built on today. Most importantly, we need people to create alternatives.

We have founded [PlantingSpace](https://planting.space) to work on new approaches and technologies that we ourselves would like to see in the world. Open reviews are one of them.

We are proposing an architecture that allows to disentangle the data layer from the layer of value adding services and products. To create the data layer for an ecosystem of open reviews, we launched the [Mangrove](https://mangrove.reviews) initiative. It aims at providing the infrastructure that enables everyone in the world with an internet access to contribute and help create an open dataset for reviews that can be used by individuals, organisations, businesses, researchers, or entrepreneurs.

## The goal of Mangrove is to enable the creation of alternatives to proprietary services

Mangrove’s roadmap consists of three main steps:

* Create an open data format for reviews that can be shaped by the community to ensure easy interoperability.  
* Build an open source infrastructure (server, aggregation algorithms, APIs) that can enable an ecosystem of applications to interact with the open dataset (e.g., navigation and mapping services, e-commerce services, local businesses, reputation management services, listing services for companies, books, charging stations, and others)  
* Make it accessible and attractive to a large variety of users (UI, documentation, promotion).  

You can check out and give input to step (1) in our [repository on GitLab](https://gitlab.com/plantingspace/mangrove). Currently, we are working on steps (2) and (3), and hope to release a first demo soon, consisting of a web-based UI and an API.  

With step (3) in mind, we make use of a number of highly valuable open datasets, such as [OpenStreetMap](https://www.openstreetmap.org/about), GLEIF‘s [Legal Entity Identifier](https://www.gleif.org/en/about/our-vision), and Internet Archive‘s [Open Library](https://openlibrary.org/), so that people can review places on the map such as restaurants or hotels, companies, books, or websites. Finally, Mangrove has high privacy standards, and uses public key cryptography in order to avoid storing personal data. It will not require a registration process.  

Mangrove is a non-profit initiative and a community project, funded by donations and grants. Its finances are managed transparently in an [Open Collective](https://opencollective.com/mangrove), with PlantingSpace as its fiscal host. The Mangrove dataset is licensed under the free and open [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) license.

## Get in touch

Twitter: @mangroveReviews  
Mastodon: @mangroveReviews@mas.to  
Email: mangrove@planting.space  
Website: [mangrove.reviews](https://mangrove.reviews)
