const mongoose = require("mongoose");
const Documents = require("./Document");

mongoose.connect("mongodb://localhost/google-docs", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    method: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const data = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", data);

    socket.on("send-changes", (delta) => {
      console.log(delta);
      socket.broadcast.to(documentId).emit("recieve-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Documents.findByIdAndUpdate(documentId, { data });
    });
  });

  console.log("Connected to socket");
});

const defaultValue = "";

const findOrCreateDocument = async (id) => {
  if (id == null) return;

  const document = await Documents.findById(id);

  if (document) return document;

  return await Documents.create({ _id: id, data: defaultValue });
};
