

help:
	@echo "make start: starts a local python server and saves the pid to the file 'pid_py_host'"
	@echo "make stop: kills the process with the pid from the file 'pid_py_host' to free the resources of the server"
	@echo "make open: opens the locally hosted application with firefox"

start:
	#start python web server in current directory and save pid to file
	python3 -m http.server & echo $$! > pid_py_host

stop:
	kill $$(cat pid_py_host)

open:
	firefox http://localhost:8000 &

run:
	@echo "starting python3 server, stop it later with 'make stop'"
	@echo "  or by killing the process with its id in the file 'pid_py_host'"
	@echo "to avoid waiting, use 'make start open'"
	sleep 10
	make start open
