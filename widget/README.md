# Open Reviews Widget

### How to use it?
For developing purposes:
```
yarn install
yarn start

```
For creating dist folder where the newest version would be displayed:

```
yarn build

```

### Used libraries
Besides smaller packages like jsonwebtoken and esling the application is also using Jest [Jest main website](https://jestjs.io/) for testing and NeutrinoJS [NeutrinoJS main website](https://neutrinojs.org/) which provides minimal development dependencies.

### Inserting icons
New icon need to be saved in assets folder so then the webpack will create appropriate access to that icon without creating additional img folder in dist repository

### Adding content to React components
In order for application to distinguish the language for which our content will be shown, all of the written instances need to be included in utils/locales to appropriate language abbreviation in the .json extension

### Global State
Some of the components depends on the global state, which was built using Context API from React and saved in GlobalState.jsx

### Outter API
The application is using outter API called mangrove-reviews, which is used for example to get JWT, which is stored in localstorage for user authentication

### User avatars
All user avatars are rounded and their color is based on the public key of the user, so every each user should have a different randomly created color. In the middle of the avatar are the initial letters of the name and/or surname of the user (depends what data user included when creating account), if the user didn't share his name initially acronym ORA would be set. The avatar is also surrounded by a ring which has a darker shade than the color inside of the circle.

### Metadata display
Before submitting the review each user is able to give his private data including nickname, name, surname, age, gender and context of the review. When the user creating the review for the first time new key is created for him and stored in local storage, also user is able to save the key in the cliboard for the future use on another devices. The user personal data are attached to the key so then when the user would like to write another review all of his personal data would be already added to the form so he doesn't have to provide them again.

### Username display
Depends on what data user choose to insert in the forms, the different results would be displayed in username field of the single review item. If the user provide full name, the full name will be displayed, if only first name was inserted, the first name would be displayed. If the user provided all date, then the nickname would be displayed. If no data was provided, only the initial avatar with the review will be displayed.



### Updates
## v0.6.5
* fixed: filter age groups
* added: react unit test with react-testing-library
* added: service request mocking with MSW

## v0.6.2 update: feedback on version 0.6.1
* fixed: missing rating: 0 in flagging data
* added: info in flagged comment (1.13)
* update: default review title (1.14)
* update: updated context labels (1.15)

## v0.6.1
* update: issuer icon two colors border
* fixed: Assignment to constant var in IssuerIcon

## v0.6.0 update: feedback on version 0.5.1
* new feature: review flagging form
* update: rating stars aligment
* update: language selector style and location
* update: change issuer info layout
* added: hover tooltips to icons
* update: review/comment title in form
* fixed: reviews withous selecting stars shouldn't send rating
* added: new reviewer icon style based on public key hash
* update: upload label
* added: new translation files
* added: information about css cusotmization [widget build release readme file](https://gitlab.com/open-reviews/open-reviews.net/-/tree/master/widget)

## v0.5.2
* update: CSS and layout

## v0.5.1
* update: login form moved to review form window

## v0.5.0
* new feature: reviews filters prototoype

## v0.4.6
* fix: missing function in comments
* update: don't hide review form when click outside
* update: review form styles, rules and more

## v0.4.5
* update: CSS and layout

## v0.4.4
* update: new review icons

## v0.4.3
* update: API urls moved to .env

## v0.4.2
* webpack: move utils dir to src

## v0.4.1
* update: example template sub
* update: hide pagination if there is only one page
* update: remove sub value from layout

## v0.4.0
* new feature: i18n support
* added: initial locale files for en and pl
* added: simple ErrorBoundary component (globally catch all js errors)
* added: locale switch component
* updated: remove JS from example template; widget code will run itself
* updated: CSS and layout

## v0.3.0
* new feature: review image gallery modal
* added: default button style
* change: hide sign in form

## v0.2.0
* new feature: image upload form

## v0.1.0
* new feature: widget autoinitialization, better build process, new example template
* update: responsive review form CSS
* webpack: publicpath fix, disable size hints

## v0.0.5
* added: confirm / positive review action
* added commenting functionality
* move review form logic to global state
* update: review form on modal
* packages update

## v0.0.4
* added: simple pagination
* updat: more readable ux (still dev)
* added: store JWK in LS
* added: get logged issuer metadata from latest review
* update: sign in form is visible
* added: source maps for dev

## v0.0.3
* added: review form MVP
* webpac: added Buffer polyfill to webpack required by mangrove-reviews lib
* added: Jdenticon to Review
* update: move CSS to separate directory

## v0.0.2 widget prototype
* 9nitial project structure
* widget can display subject reviews and comments
* basic styling is available