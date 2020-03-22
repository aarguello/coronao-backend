build:
	docker-compose build --no-cache
run:
	docker-compose up -d
	docker logs -f coronao-backend_app_1
clean:
	docker-compose down -v --remove-orphans
