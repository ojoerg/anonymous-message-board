var dotenv = require("dotenv").config();
var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = process.env.SERVER;
var testThreadId = "",
  testThreadId2 = "5e5d37867bf6041435243317",
  deletePassword = "chai1234",
  testThreadText = "test with chai",
  testReplyText = "replied with chai",
  testReplyId = "",
  testReplyId2 = "",
  wrongThreadId = "00000000000000000000001",
  wrongPass = "wrongPass";
chai.use(chaiHttp);

suite("Functional Tests", function() {
  this.timeout(10000);
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST Thread", function() {
      test("POST with all data passed", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({
            text: testThreadText,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.include(res.req.path, "/b/test");
            done();
          });
      });

      test("POST with only text passed", function(done) {
        chai
          .request(server)
          .post("/api/threads/chai-test")
          .send({
            text: testThreadText
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("POST with only delete_password passed", function(done) {
        chai
          .request(server)
          .post("/api/threads/chai-test")
          .send({
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });
    });

    suite("GET Thread", function() {
      test("GET 10 most recent bumped threads", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            assert.isAtMost(res.body[0].replies.length, 3);
            assert.equal(res.body[0].text, testThreadText);
            testThreadId = res.body[0]._id;
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("DELETE without thread_id", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .query({
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE with wrong thread_id", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .query({
            thread_id: wrongThreadId,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE without delete_password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .query({
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE with wrong delete_password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .query({
            thread_id: testThreadId,
            delete_password: wrongPass
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("DELETE from test 1", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .query({
            thread_id: testThreadId,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });

      test("POST: Recreate Test-Thread", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({
            text: testThreadText,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.include(res.req.path, "/b/test");
            done();
          });
      });

      test("GET set testThreadId again", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            assert.isAtMost(res.body[0].replies.length, 3);
            assert.equal(res.body[0].text, testThreadText);
            testThreadId = res.body[0]._id;
            done();
          });
      });
    });

    suite("PUT", function() {
      test("PUT: Report Thread, wrong thread_id", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .query({
            thread_id: wrongThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT: Report Thread, without thread_id", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .query({})
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT: Report Thread", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .query({
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("POST without text", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            delete_password: deletePassword,
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("POST without delete_password", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: testReplyText,
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("POST without thread_id", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: testReplyText,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("POST without data", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("POST with wrong thread_id", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: testReplyText,
            delete_password: deletePassword,
            thread_id: wrongThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("POST with all data passed", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({
            text: testReplyText,
            delete_password: deletePassword,
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.include(res.req.path, "/b/test");
            done();
          });
      });
    });

    suite("GET", function() {
      test("GET with wrong thread_id", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({
            thread_id: wrongThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("GET with correct thread_id", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].replies.length, 1);
            assert.equal(res.body[0].text, testThreadText);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password");
            assert.notProperty(res.body[0], "__v");
            assert.property(res.body[0].replies[0], "_id");
            assert.property(res.body[0].replies[0], "text");
            assert.property(res.body[0].replies[0], "created_on");
            assert.notProperty(res.body[0].replies[0], "reported");
            assert.notProperty(res.body[0].replies[0], "delete_password");
            testReplyId = res.body[0].replies[0]._id;
            done();
          });
      });
    });

    suite("PUT", function() {
      test("PUT with wrong thread_id, right reply_id", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .query({
            thread_id: wrongThreadId,
            reply_id: testReplyId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT with right thread_id, wrong reply_id", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .query({
            thread_id: testThreadId,
            reply_id: wrongThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT without thread_id", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .query({
            reply_id: testReplyId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT without reply_id", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .query({
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT without data", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .query({})
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("PUT with right thread_id", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .query({
            thread_id: testThreadId,
            reply_id: testReplyId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("DELETE reply from test thread with wrong thread_id", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            thread_id: wrongThreadId,
            reply_id: testReplyId,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE reply from test thread with wrong reply_id", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            thread_id: testThreadId,
            reply_id: wrongThreadId,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE reply from test thread with wrong delete_password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            thread_id: testThreadId,
            reply_id: testReplyId,
            delete_password: wrongPass
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("DELETE reply from test thread without thread_id", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            reply_id: testReplyId,
            delete_password: wrongPass
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE reply from test thread without reply_id", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            thread_id: testThreadId,
            delete_password: wrongPass
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE reply from test thread without delete_password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            thread_id: testThreadId,
            reply_id: testReplyId
          })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "invalid data");
            done();
          });
      });

      test("DELETE reply from test thread with correct data", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .query({
            thread_id: testThreadId,
            reply_id: testReplyId,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });

      test("DELETE test thread", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .query({
            thread_id: testThreadId,
            delete_password: deletePassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });
});
