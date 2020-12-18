FROM node:15.4.0-alpine3.10

WORKDIR /server

COPY . /server
RUN yarn install

EXPOSE 2001
CMD [ "yarn", "start" ]