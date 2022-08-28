

start:
	#start python web server in current directory and save pid to file
	python3 -m http.server & echo $$! > pid_py_host

stop:
	kill $$(cat pid_py_host)

open:
	firefox http://localhost:8000
