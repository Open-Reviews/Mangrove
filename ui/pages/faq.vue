<template>
  <v-container style="max-width: 1200px">
    <span class="display-1"> Frequently asked questions <br /><br /> </span>
    <v-expansion-panels>
      <v-expansion-panel v-for="qa in qas" :key="qa.q">
        <v-expansion-panel-header>
          <span class="title">{{ qa.q }}</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content
          ><span v-html="qa.a"
        /></v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <br />
    <br />
    <p v-html="extrainfo" class="text-center subtitle-1" />
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      qas: [
        {
          q: 'How do you avoid spam and ensure reliable reviews and ratings?',
          a: ` 
            Mangrove applies a variety of measures to ensure a high reliability of ratings and usefulnes of the dataset:
            <ul>
              <li><b>Users can mark reviews</b> as useful, and they can confirm the experience expressed in a review. This information is used by the aggregation algorithm to give high quality reviews a higher weight in the aggregated rating, and display them higher up in the list.</li>
              <li>Users can <b>flag reviews as inappropriate</b> if a review is violating the Terms of Service, so that abusive content and harassment do not get spread.</li>
              <li>Reviewers are assigned a <b>'reliability score'</b> by the aggregation algorithm, reflecting their track record and quality.</li>
              <li><b>Businesses can reply</b> to their customer's reviews, thereby allowing a more balanced view, especially when conflicts occurred.</li>
              <li><b>Businesses can invite their customers</b> to leave reviews, allowing to mark those reviews as 'verified purchases' (coming soon).</li>
              <li>The Mangrove <b>aggregation algorithm uses probabilistic models</b> to identify fraudulent reviews and devalue them, as well as flag them as probably fraudulent to the viewer.</li>
              <li>If reviews clearly violate the Terms of Service (abusive content and harassment), they are not deleted but moved to a different database where Mangrove stores them in case of a dispute. The original review entry will still be visible, but instead of the abusive content a note is displayed why the content was removed.</li>
            </ul>
            We believe that advanced algorithms and a strong, inclusive community with a sense of citizenship are a better at ensuring reliable ratings at large scale than the control of a centralized authority, especially when driven by advertising revenues.
          `
        },
        {
          q: 'What data gets stored in the open dataset?',
          a: `
            <ul>
              <li>The user’s public key.</li>
              <li>The submitted star rating.</li>
              <li>The submitted review text.</li>
              <li>Uploaded media files.</li>
              <li>Additional information if entered by the user (display name, given name, family name, age, gender, context of the experience)).</li>
            </ul>
            You can check what data has been stored in the database by clicking “More” -> “Show raw Mangrove review” next to each review, or by downloading the dataset.
In addition to that, you can inspect the code and the Mangrove Review Standard that defines the data structure and more in our <a href="https://gitlab.com/plantingspace/mangrove" target="_blank">GitLab repository</a>.
          `
        },
        {
          q: 'What databases does Mangrove use?',
          a: `
            <ul>
              <li><b>Places on the map: <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>.</b>
OpenStreetMap is built by a community of mappers that contribute and maintain data about roads, trails, cafés, railway stations, and much more, all over the world. OpenStreetMap's community is diverse, passionate, and growing every day. Contributors include enthusiast mappers, GIS professionals, engineers running the OSM servers, humanitarians mapping disaster-affected areas, and many more.</li>
              <li><b>Companies: <a href="https://www.gleif.org/en" target="_blank">GLEIF’s Legal Entity Identifier</a>.</b> GLEIF is a supra-national not-for-profit organization established by the Financial Stability Board to support the implementation and use of the Legal Entity Identifier (LEI). It connects to key reference information that enables clear and unique identification of legal entities participating in financial transactions. Each LEI contains information about an entity’s ownership structure and answers the questions of ‘who is who’ and ‘who owns whom’.</li>
              <li><b>Books: Internet Archive’s <a href="https://openlibrary.org" target="_blank">Open Library</a>.</b> Open Library is an open, editable library catalog, building towards a web page for every book ever published.</li>
            </ul
            Read more about the databases and tools used by Mangrove, as well as the principles guiding the design choices, in the Mangrove Review Standard in our <a href="https://gitlab.com/plantingspace/mangrove" target="_blank">GitLab repository</a>.
          `
        },
        {
          q: 'How does Mangrove protect the privacy of users?',
          a: `
            <ul>
              <li><b>No registration or login</b> process requesting and storing personal data.</li>
              <li><b>No tracking</b>, no cookies, no gathering of user data behind the scenes, and no advertisement.</li>
              <li>We use <a href="https://en.wikipedia.org/wiki/Public-key_cryptography" target="_blank">public key cryptography</a> to authenticate a user and to establish a user’s reputation within the system.</li>
              <li>The cryptographic key pair is generated by the user’s browser, and is <b>stored locally and temporarily on the device</b> within the browser’s IndexedDB (we recommend saving the private key in a password manager).</li>
            </ul>
          `
        },
        {
          q:
            'What’s a cryptographic key pair and why do I need to store my private key?',
          a: `
            Mangrove uses <a href="https://en.wikipedia.org/wiki/Public-key_cryptography" target="_blank">public key cryptography</a> to authenticate a user and to establish a user’s reputation within the system, which allows us to get rid of registrations and logins, and makes storing user’s personal information obsolete.

Public-key cryptography uses pairs of keys: public keys which may be disseminated widely, and private keys which are known only to the owner. Both are generated in your browser when you access Mangrove, and are stored locally in a <b>temporary</b> storage (IndexedDB). 

The public key represents <b>your identifier</b> that will be displayed with each review you write. It allows you to build a reputation to make your opinion count more. This is because the algorithm that aggregates individual reviews to a final rating gives higher weight to public keys that have published many high-quality reviews. This is part of ensuring a high reliability of the ratings.

The private key is used to <b>create a digital signature to authenticate you</b> so that no one else can write reviews with your identifier.

By default, a new key pair is generated each time you access Mangrove from a new device, a new browser, or after clearing your browser data. To be able to write reviews under a previously used public key, you need to have access to the corresponding private key. <b>We recommend storing it in a password manager</b>.
To access a previously used public key simply click the “Switch identifier” button, and import the corresponding private key.

          `
        },
        {
          q: 'Who is behind the Mangrove initiative?',
          a: `
            Mangrove is an open-source, non-profit community project started and maintained by PlantingSpace, a limited liability company incorporated in Zug, Switzerland. 

PlantingSpace is hosting the Original Mangrove Server and dataset, but we encourage anyone to mirror the dataset on other servers.

Mangrove’s financial resources are managed fully transparently via <a href="https://opencollective.com/mangrove" target="_blank">Open Collective</a>. PlantingSpace has the role of a Fiscal Host for the Mangrove collective, meaning that it is the legal entity holding the money and responsible for admin/taxes forms for the collective.    

          `
        },
        {
          q: 'How is Mangrove funded?',
          a: `
            Mangrove is an open-source, non-profit community project and funded by donations and sponsors. All financial resources are managed 100% transparently via <a href="https://opencollective.com/mangrove" target="_blank">Open Collective</a>.

If you run a business and are using the Mangrove open dataset as part of a revenue-generating service, it makes business sense to sponsor Mangrove: it ensures the project that your service relies on stays healthy and actively maintained. It can also help your exposure in the Open Data community.

If you are an individual user and have enjoyed sharing and gaining insights through Mangrove reviews, consider donating as a sign of appreciation - like offering the Mangrove maintainers a coffee once in a while :) 
  
          `
        },
        {
          q: 'How can I contact you?',
          a: `
            <ul>
              <li>For general inquiries and feedback, please email us at hello@planting.space</li>
              <li>To discuss with us live you can also join our chat on <a href="https://matrix.to/#/!NWvCdVEAXYJRnXTudO:matrix.org?via=matrix.org">Riot</a>.</li>
              <li>To suggest a new feature or an edit, you can make a pull request to our <a href="https://gitlab.com/plantingspace/mangrove" target="_blank">GitLab repository</a>.</li>
            </ul>
          `
        }
      ],
      extrainfo: `Not found what you were looking for? Contact us at hello(at)mangrove(dot)reviews, or discuss with us in our <a href="https://matrix.to/#/!NWvCdVEAXYJRnXTudO:matrix.org?via=matrix.org">Riot chat</a>.`
    }
  }
}
</script>
