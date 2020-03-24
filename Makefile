build:
	docker-compose build --no-cache
run:
	docker-compose up -d
	docker logs -f coronao-backend_app_1
debug:
	docker-compose -f docker-compose-debug.yaml up -d
	docker logs -f coronao-backend_app_1
clean:
	docker-compose down -v --remove-orphans
