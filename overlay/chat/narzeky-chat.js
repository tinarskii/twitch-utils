// Please use event listeners to run functions.
document.addEventListener("onLoad", function (obj) {
  // obj will be empty for chat widget
  // this will fire only once when the widget loads
});

document.addEventListener("onEventReceived", async function (obj) {
  const response = await fetch(
    "/api/nickname?" + new URLSearchParams({ id: obj.detail.tags["user-id"] }),
  );
  const nickname = await response.text();

  let msgBox = obj.detail.messageId + "-container";
  let msgAuthor = obj.detail.messageId + "-author";

  // User role
  let isSub = obj.detail.subscriber;
  let isStreamer = obj.detail.owner;
  let isVIP = !!Number(obj.detail.tags.vip);
  let isMod = !!Number(obj.detail.tags.mod);

  // User info
  let userRole = isStreamer
    ? "owner"
    : isSub
      ? "sub"
      : isVIP
        ? "vip"
        : isMod
          ? "mod"
          : "normal";
  let userID = obj.detail.tags["user-id"];
  let userDisplayName = obj.detail.tags["display-name"];
  let userColor = obj.detail.tags.color;

  // Add class for user role
  document.getElementById(msgBox).classList.add(userRole);

  // Check for nickname
  if (nickname)
    document.getElementById(msgAuthor).innerHTML =
      `${userDisplayName} (${nickname})`;

  // Add user color to the left border
  document.getElementById(msgBox).style.borderLeftColor = userColor;
});