FROM node:8-slim

WORKDIR /server

COPY . /server
RUN yarn install

EXPOSE 2001
CMD [ "yarn", "start" ]