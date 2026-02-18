FROM dxflrs/garage:v2.2.0 AS garage-bin

FROM alpine:3.21

COPY --from=garage-bin /garage /usr/local/bin/garage

RUN apk add --no-cache ca-certificates

ENTRYPOINT ["/bin/sh", "/init-garage.sh"]
