<template>
  <v-container style="max-width: 1000px">
    <span class="display-1">{{ title }}<br /><br /> </span>
    <v-expansion-panels>
      <v-expansion-panel v-for="qa in qas" :key="qa.q">
        <v-expansion-panel-header>
          <span class="title font-weight-light">{{ qa.q }}</span>
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
  head() {
    return { title: this.title }
  },
  data() {
    return {
      title: 'Frequently asked questions',
      qas: [
        {
          q: 'How do you avoid spam and ensure reliable reviews and ratings?',
          a: `
            Mangrove applies a variety of measures to ensure a high reliability of ratings and usefulnes of the dataset:
            <ul>
              <li><b>Users can mark reviews</b> as useful, and they can confirm the experience expressed in a review. This information is used by the aggregation algorithm to give high quality reviews a higher weight in the aggregated rating, and display them higher up in the list.</li>
              <li>Users can <b>flag reviews as inappropriate</b> if a review is violating the Terms of Service, so that abusive content and harassment do not get spread.</li>
              <li>Reviewers are assigned a <b>reliability score</b> by the aggregation algorithm, reflecting their track record and quality.</li>
              <li><b>Businesses can reply</b> to their customer's reviews, thereby allowing a more balanced view, especially when conflicts occurred.</li>
              <li><b>Businesses can invite their customers</b> to leave reviews, allowing to mark those reviews as 'verified purchases' (coming soon).</li>
              <li>The Mangrove <b>aggregation algorithm uses probabilistic models</b> to identify fraudulent reviews and devalue them, as well as flag them as probably fraudulent to the viewer.</li>
              <li>If reviews clearly violate the Terms of Service (abusive content and harassment), they are moved to a different database where Mangrove stores them in case of a dispute. The original review entry will still be visible, but instead of the abusive content a note is displayed why the content was removed.</li>
            </ul>
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
              <li>Additional information if entered by the user, such as display name, given name, family name, age, gender, context of the experience.</li>
            </ul>
            You can check what data has been stored in the database by clicking “More” -> “Show raw Mangrove review” next to each review, or by downloading the dataset.
In addition to that, you can inspect the code and the Mangrove Review Standard that defines the data structure and more in our <a href="https://gitlab.com/open-reviews/mangrove" target="_blank">GitLab repository</a>.
          `
        },
        {
          q:
            'What 3rd party databases does the Mangrove web app use to allow reading and writing reviews?',
          a: `
            <ul>
              <li><b>Places on the map: <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>.</b>
OpenStreetMap is built by a community of mappers that contribute and maintain data about roads, trails, cafés, railway stations, and much more, all over the world. OpenStreetMap's community is diverse, passionate, and growing every day. Contributors include enthusiast mappers, GIS professionals, engineers running the OSM servers, humanitarians mapping disaster-affected areas, and many more.</li>
              <li><b>Companies: <a href="https://www.gleif.org/en" target="_blank">GLEIF’s Legal Entity Identifier</a>.</b> GLEIF is a supra-national not-for-profit organization established by the Financial Stability Board to support the implementation and use of the Legal Entity Identifier (LEI). It connects to key reference information that enables clear and unique identification of legal entities participating in financial transactions. Each LEI contains information about an entity’s ownership structure and answers the questions of ‘who is who’ and ‘who owns whom’.</li>
              <li><b>Books: Internet Archive’s <a href="https://openlibrary.org" target="_blank">Open Library</a>.</b> Open Library is an open, editable library catalog, building towards a web page for every book ever published.</li>
            </ul>
            Read more about the databases and tools used by Mangrove, as well as the principles guiding the design choices, in the Mangrove Review Standard in our <a href="https://gitlab.com/open-reviews/mangrove" target="_blank">GitLab repository</a>.
          `
        },
        {
          q: 'How does Mangrove protect the privacy of users?',
          a: `
            <ul>
              <li><b>No registration or login</b> process requesting and storing personal data.</li>
              <li><b>No tracking</b>, no cookies, no gathering of user data behind the scenes, and no advertisement.</li>
              <li>We use <a href="https://en.wikipedia.org/wiki/Public-key_cryptography" target="_blank">public key cryptography</a> to authenticate a user and to establish a user’s reputation within the system, never requiring a user to reveal any personal data.</li>
              <li>The cryptographic key pair is generated by the user’s browser, and is <b>stored locally and temporarily on user's device</b> within the browser’s IndexedDB (we recommend saving the private key in a password manager).</li>
            </ul>
          `
        },
        {
          q:
            'What’s a cryptographic key pair and why do I need to store my private key?',
          a: `
            Mangrove uses <a href="https://en.wikipedia.org/wiki/Public-key_cryptography" target="_blank">public key cryptography</a> to identify a user and to establish a user’s reputation within the system without the need for a central identity server. Participating apps and websites in the open reviews ecosystem therefore don't have to rely on a central party to manage identities across applications. This approach makes registrations and logins, as well as storing user’s personal information, obsolete.
</br>

Public-key cryptography uses pairs of keys: public keys which may be disseminated widely, and private keys which are known only to the owner. Both are generated in your browser when you access Mangrove, and are stored locally in a <b>temporary</b> storage (IndexedDB) on your device.
</br>

The public key represents <b>your identifier</b> that will be displayed with each review you write. It allows you to build a reputation to make your opinion count more. This is because the algorithm that aggregates individual reviews to a final rating gives higher weight to public keys that have published many high-quality reviews. This is part of ensuring a high reliability of the ratings. Find your public key on the <a href="https://mangrove.reviews/account" target="_blank">Account page</a> under "Advanced".
</br>

The private key is used to <b>create a digital signature to authenticate you</b> so that no one else can write reviews with your identifier. Throughout the web app we call the private key a "password" so that it is easier to understand for less technical users. </br>

By default, a new key pair is generated each time you access Mangrove from a new device, a new browser, or after clearing your browser data. To be able to write reviews under a previously used public key, you need to have access to the corresponding private key. <b>We therefore recommend storing the private key in a password manager</b>.
To access a previously used public key simply import the corresponding private key on the <a href="https://mangrove.reviews/account" target="_blank">Account page</a> under "Advanced".
          `
        },
        {
          q: 'Who is behind the Mangrove initiative?',
          a: `
            Mangrove is an open-source community project. It is maintained by the non-profit <a href="https://open-reviews.net" target="_blank">Open Reviews Association</a> that acts as a legal entity for the Mangrove open-source technology, and is the custodian for the computer servers and services necessary to host the open dataset. The project was initially started by <a href="https://planting.space" target="_blank">PlantingSpace</a>.

</br>
The Open Reviews Association is hosting the Original Mangrove Server and dataset, but we encourage anyone to mirror the dataset on other servers.
          `
        },
        {
          q: 'How is Mangrove funded?',
          a: `
            Mangrove is an open-source, non-profit community project funded by grants, sponsoring, and donations via the non-profit <a href="https://open-reviews.net" target="_blank">Open Reviews Association</a>.

</br>
Everyone with an interest in open reviews is invited to join the Open Reviews Association (ORA) as a <a href="https://open-reviews.net/membership/" target="_blank">member</a> and to contribute to the movement actively by bringing in their skills and interests, whether that is promoting and connecting ORA to relevant parties, helping with comms and social media, improving the code base, giving a hand to integrators, coordinating research activities, or fundraising: any contribution is welcome!

          `
        },
        {
          q: 'How can I contact you?',
          a: `
            <ul>
              <li>For general inquiries and feedback, please email us at hello@open-reviews.net</li>
              <li>To discuss with the team and community, you can join our chat on <a href="https://app.element.io/#/room/#mangrove:matrix.org">Element</a>.</li>
              <li>To suggest a new feature or an edit, you can make a pull request to our <a href="https://gitlab.com/open-reviews/mangrove" target="_blank">GitLab repository</a>.</li>
            </ul>
          `
        }
      ],
      extrainfo: `Not found what you were looking for? Contact us at hello(at)open-reviews(dot)net, or discuss with us in our <a href="https://app.element.io/#/room/#mangrove:matrix.org">Element chat</a>.`
    }
  }
}
</script>
