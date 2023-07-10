# Irish public transit tracker

<!-- > A demonstration of this fancy project.
> Live demo [_here_](live_link_here). -->

## Table of Contents

- [Overview](#overview)
  - [Project description](#project-description)
  - [Features](#features)
  - [Screenshots](#screenshots)
- [My process](#my-process)
  - [Built With](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
- [Instructions](#instructions)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Deployment](#deployment)
- [Acknowledgements](#acknowledgements)
- [Author](#Author)

## Overview

### Project Description

This is an easy to use alternative to the TFI Live transit App.

- Search public bus and train schedules across Ireland for their favorite travel routes.
- Save favorite transit stops for quick future access.
- View scheduled and real arrival estimates for upcoming trains and buses. No more wondering when your bus is actually supposed to arrive.
- Select trips to display current or estimated train or bus positions.

### Features

- Search backend SQL database served by REST apis for scheduled public transit routes.
- Leaflet map displays interactive transit stops, route paths, arrival times, and estimated vehicle position.
- Interactive features include travel date/time picker, departure point by stop, and scheduled trip selection.
- Redis realtime transit data cache provides fast trip updates by serving only user requested trips.
- Containerized with Docker for flexible and easy deployment.

### Screenshots

<!-- ![Example desktop screenshot](./img/screenshot-desktop.png)

<details>

  <summary>Click here to show mobile screenshot</summary>

![Example mobile screenshot](./img/screenshot-mobile.png)

</details>

<br/><br/>

Add a screenshot. The easiest way to do this is to use Firefox to view your project, right-click the page and select "Take a Screenshot". You can choose either a full-height screenshot or a cropped one based on how long the page is. If it's very long, it might be best to crop it.

Alternatively, you can use a tool like [FireShot](https://getfireshot.com/) to take the screenshot. FireShot has a free option, so you don't need to purchase it.

Then crop/optimize/edit your image however you like, add it to your project, and update the file path in the image above. -->

## My Process

### Built With

- React and Next.JS
- TypeScript
- CSS and Tailwind
- Leaflet
- SQL and SQLite
- Prisma
- Docker
- Redis
- REST apis
- git
- National Transit Authority Realtime API
- [Transport for Ireland public transit data](https://www.transportforireland.ie/transitData/PT_Data.html)

### Continued Development

<!-- - an issue that needs work -->

### What I learned

<!-- Include unexpected issues / bugs encountered. How were they resolved?

- an issue I found

Code examples

```html
<h1>Some HTML code I'm proud of</h1>
```

```css
.proud-of-this-css {
  color: papayawhip;
}
```

```js
const proudOfThisFunc = () => {
  console.log("🎉");
};
``` -->

## Instructions

### Setup

`npm install`

### Usage

- `npm run dev`

  or

- `npm run build` then `npm run preview`

### Deployment

- Build and import new SQLite database from [https://www.transportforireland.ie/transitData/Data/GTFS_All.zip](https://www.transportforireland.ie/transitData/Data/GTFS_All.zip)
- Ensure required table columns match schema.prisma
- place database file as `gtfs.db` @ `prisma/gtfs.db`
- run `npx prisma db push` to set database indexes

#### deploy to Fly.io

- install flyctl available from [fly.io](fly.io)
- first time deployment run `fly launch`
- run `npm run deploy`
- run `fly secrets set DATABASE_URL=file:gtfs.db`
- run `fly secrets set NTA_REALTIME_API_KEY=api key from NTA GTFS realtime api below`

## Useful resources

- [Transport operator schedule data](https://www.transportforireland.ie/transitData/PT_Data.html)
- [NTA GTFS realtime api](https://developer.nationaltransport.ie/api-details#api=gtfsr&operation=gtfsr-v2)
- [General transit feed specifications](https://gtfs.org)

## Author

- [see my portfolio](https://david-abell.github.io/personal-portfolio/)
- [vist my LinkedIn](https://www.linkedin.com/in/davidabell722/)

## Acknowledgements
