FROM golang:1.26-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/submission-service .

FROM alpine:3.22

WORKDIR /app

RUN adduser -D -u 10001 appuser

COPY --from=builder /out/submission-service /app/submission-service
COPY --from=builder /src/languages.json /app/languages.json

USER appuser

EXPOSE 8001

CMD ["/app/submission-service"]
