FROM node:slim

RUN npm install -g cytoscape
RUN npm install -g argparse

RUN mkdir /tmp/cdcytojslayout
COPY package.json /tmp/cdcytojslayout
RUN mkdir /tmp/cdcytojslayout/bin
COPY bin/index.js /tmp/cdcytojslayout/bin

RUN cd /tmp/cdcytojslayout \
      && npm install . \
      && npm install -g . \
      && cd /tmp


ENTRYPOINT ["/usr/local/bin/cdcytojslayout"]
CMD ["--help"]
