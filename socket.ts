import net from "net";

const socket = net.createServer();

function newConn(socket: net.Socket) {
	console.log(
		`New connection from ${socket.remoteAddress}:${socket.remotePort}`,
	);

	socket.on("end", () => {
		console.log("received FIN");
	});

	socket.on("data", (data: Buffer) => {
		if (data.length > 0) {
			socket.write(data);
		}

		if (data.includes("q")) {
			console.log("closing...");
			socket.end();
		}
	});
}

socket.on("connection", newConn);
console.log("server listening on port 8080");
socket.listen("8080");
