const { fork } = require("child_process");
const path = require("path");

// Run server in a background process
process.env.PORT = "3001";
process.env.USE_SQLITE = "true"; // Force SQLite for tests to avoid MySQL dependencies
process.env.TOKEN_SECRET = "test-secret-key-1234567890-test-secret-key";

console.log("Starting test server on port 3001 using SQLite...");
const serverProcess = fork(path.join(__dirname, "bin/www"), [], {
  env: { ...process.env }
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  // Wait for server to boot
  await delay(3000);

  const baseUrl = "http://localhost:3001/api";
  let userToken = "";
  let adminToken = "";
  let testTweetId = null;

  try {
    console.log("\n🧪 Running API Tests...");

    // Test 1: Register User
    console.log("Test 1: Registering new user 'test_user'...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test_user",
        email: "test@x.com",
        password: "password123"
      })
    });
    const regData = await regRes.json();
    if (regRes.status !== 201) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
    console.log("✅ Register successful! Token generated.");
    userToken = regData.token;

    // Test 2: Login User
    console.log("Test 2: Logging in 'test_user'...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test_user",
        password: "password123"
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    console.log("✅ Login successful!");

    // Test 3: Login Admin (seeded automatically in db.init)
    console.log("Test 3: Logging in Admin...");
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "admin123"
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    console.log("✅ Admin login successful!");
    adminToken = adminLoginData.token;

    // Test 4: Create Tweet
    console.log("Test 4: Creating a tweet...");
    const tweetRes = await fetch(`${baseUrl}/tweets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        content: "Este é um tweet de teste da API! #testing"
      })
    });
    const tweetData = await tweetRes.json();
    if (tweetRes.status !== 201) throw new Error(`Create tweet failed: ${JSON.stringify(tweetData)}`);
    console.log(`✅ Tweet created! ID: ${tweetData.tweet_id}`);
    testTweetId = tweetData.tweet_id;

    // Test 5: Get Feed
    console.log("Test 5: Fetching global feed...");
    const feedRes = await fetch(`${baseUrl}/tweets`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const feedData = await feedRes.json();
    if (feedRes.status !== 200) throw new Error(`Get feed failed: ${JSON.stringify(feedData)}`);
    console.log(`✅ Feed retrieved! Found ${feedData.length} tweets.`);

    // Test 6: Like Tweet
    console.log("Test 6: Liking the tweet...");
    const likeRes = await fetch(`${baseUrl}/tweets/${testTweetId}/like`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const likeData = await likeRes.json();
    if (likeRes.status !== 200) throw new Error(`Like failed: ${JSON.stringify(likeData)}`);
    console.log("✅ Tweet liked successfully.");

    // Test 7: Follow User (maria_reis is ID 3 in seeded data)
    console.log("Test 7: Following user ID 3...");
    const followRes = await fetch(`${baseUrl}/users/3/follow`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const followData = await followRes.json();
    if (followRes.status !== 200) throw new Error(`Follow failed: ${JSON.stringify(followData)}`);
    console.log("✅ Followed user successfully.");

    // Test 8: Admin List Users
    console.log("Test 8: Admin listing all users...");
    const adminUsersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const adminUsers = await adminUsersRes.json();
    if (adminUsersRes.status !== 200) throw new Error(`Admin user list failed: ${JSON.stringify(adminUsers)}`);
    console.log(`✅ Admin listed ${adminUsers.length} users successfully.`);

    console.log("\n🎉 All API tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Test execution failed:", error.message);
    process.exitCode = 1;
  } finally {
    console.log("Stopping test server...");
    serverProcess.kill();
    // Wait for process to clean up
    await delay(1000);
    process.exit();
  }
}

runTests();
