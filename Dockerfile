FROM node:14.4.0

WORKDIR /server

COPY . /server
RUN yarn install

EXPOSE 2001
CMD [ "yarn", "start" ]