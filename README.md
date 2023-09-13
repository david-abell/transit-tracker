# Irish public transit tracker

> Live demo [_here_](https://transit-tracker.fly.dev).

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
- Continuous deployment with github workflows ensures Transport schedules are kept up to date.

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
- Github Workflows
- National Transit Authority Realtime API
- [Transport for Ireland public transit data](https://www.transportforireland.ie/transitData/PT_Data.html)

### Continued Development

- A timeline schedule component as an alternative to the map layout.

### What I learned

#### Persisting values from Github workflows

Sharing database version time stamps between Github workflows for continuos deployment proved unexpectedly difficult. Database files become outdated in anywhere from a few days to a few weeks. I needed a simple way to store last modified headers from the TFI endpoint to know when the database needed to be rebuild.

Repository variables seemed like the right place to store this but it turned out after a few attempts that `Actions` & `Workflows`, while they could read secrets and variables, could not be granted write permission.

Stack overflow suggested to curl the Github rest api but requests were always rejected by the api with `"message": "Resource not accessible by integration"`. I attempted variations of the job below. Setting global repository workflow permission for read and write did not work.

```yml
test:
  runs-on: ubuntu-latest
  permissions: write-all
  steps:
    - name: REST API with curl
      run: |
        value="${LAST_MODIFIED}"
        curl -L \
        -X PATCH \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        https://api.github.com/repos/${{ github.repository }}/actions/variables/GTFS_LAST_MODIFIED \
        -d '{"name":"GTFS_LAST_MODIFIED","value":"${value}"}'
```

Workflow artifacts seemed to be the only in house possibility but they were cumbersome to work with. Importing and exporting artifacts between jobs in a workflow proved fairly simple but it turns out that, like environment variables, there is no method for sharing them between workflow runs. Elio Struyf's article [Retrieving an artifact from a previous GitHub Actions workflow](https://www.eliostruyf.com/retrieving-artifact-previous-github-actions-workflow/) saved me the hassle of figuring out how to grab the most recently generated artifact.

The repository public workflow apis available at `https://api.github.com/repos/OWNER/REPO/actions/artifacts` and `https://api.github.com/repos/OWNER/REPO/actions/workflows/[workflow-filename]/runs` were especially helpful for understanding api response structure and retrieving the correct artifacts.

<!-- [workflow_api](https://api.github.com/repos/david-abell/transit-tracker/actions/workflows/check-database-version.yml/runs) -->

<!-- [artifact_api](https://api.github.com/repos/david-abell/transit-tracker/actions/artifacts) -->

## Instructions

### Setup

`npm install`

run `npm run db-import` to populate the schedule database.

For live schedule data clone the REDIS server repo [@ADD_REDIS_SERVER_REPO_LINK](), install, build the docker container and ensure that it is running.

### Usage

then

- `npm run dev`

  or

- `npm run build && npm run start`

### Deployment

Deployment is automated with Github workflows ` push`` or  `merges` to main and nightly API checks to the TFI GTFS API. For live schedule updates the redis server must be cloned and deployed separately.

#### deploy to Fly.io

- install flyctl available from [fly.io](fly.io)
- run `fly launch`
- run `fly secrets set DATABASE_URL=file:gtfs.db`
- run `fly secrets set NTA_REALTIME_API_KEY=api key from NTA GTFS realtime api below`
- run `npm run deploy`

## Useful resources

- [Transport operator schedule data](https://www.transportforireland.ie/transitData/PT_Data.html)
- [NTA GTFS realtime api](https://developer.nationaltransport.ie/api-details#api=gtfsr&operation=gtfsr-v2)
- [General transit feed specifications](https://gtfs.org)

## Author

- [see my portfolio](https://david-abell.github.io/personal-portfolio/)
- [visit my LinkedIn](https://www.linkedin.com/in/davidabell722/)

## Acknowledgements

- Elio Struyf's article mentioned above [Retrieving an artifact from a previous GitHub Actions workflow](https://www.eliostruyf.com/retrieving-artifact-previous-github-actions-workflow/)
- I relied heavily on Brendan Nee @BlinkTagInc and [node-gtfs](https://github.com/BlinkTagInc/node-gtfs) for initial database trials.
