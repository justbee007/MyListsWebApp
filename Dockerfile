#!/bin/bash
# #Use general node image as builder and install dependencies
# FROM --platform=linux/amd64 node:12
# ENV NODE_VERSION 12
FROM node:12 AS build-env
ADD . /webapp
WORKDIR /webapp
RUN rm -rf node_modules
# RUN npm ci --omit=dev
RUN npm i
# RUN npm install -g npm@latest

## Copy application with its dependencies into distroless image
# FROM gcr.io/distroless/nodejs
# COPY --from=build-env /webapp /webapp
# WORKDIR /webapp
CMD ["index.js"]
