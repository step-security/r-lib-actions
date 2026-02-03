FROM gcr.io/oss-fuzz-base/base-builder:v1@sha256:71cb21e001d942747941f178daa06bf96c5d0a88751c7c247ff3233d843e093f
RUN apt-get update && apt-get install -y r-base make libxml2-dev libcurl4-openssl-dev
COPY . $SRC/actions
WORKDIR actions
COPY .clusterfuzzlite/build.sh $SRC/
