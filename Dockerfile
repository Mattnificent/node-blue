FROM node:6
MAINTAINER Matthew Beck <mattbeckondeck@gmail.com>

ADD . /site

RUN cd /site && \
    npm install

WORKDIR /site

CMD ["node", "server" ]

