class NotificationManager {
  constructor() {
    this.messageId = 0;
  }

  showMessage(messageText, persistant) {
    requestAnimationFrame(() => {
      this._addMessageToPage(messageText, persistant, false);
    });
  }

  showError(messageText, persistant) {
    requestAnimationFrame(() => {
      this._addMessageToPage(messageText, persistant, true);
    });
  }

  _addMessageToPage(text, persistant, isError) {
    const parent = document.getElementById("notification-area");
    const newMessageId = this.messageId++;

    let messageContainer = document.createElement("div");
    messageContainer.classList.add("notification");
    if (isError) {
      messageContainer.classList.add("error");
    }
    messageContainer.tabIndex = 0;
    messageContainer.setAttribute("data-messageid", newMessageId);
    messageContainer.setAttribute("role", "alert");

    let message = document.createElement("div");
    message.classList.add("message");
    message.innerText = text;
    messageContainer.appendChild(message);

    let closeButton = document.createElement("button");
    closeButton.innerText = "✖";
    closeButton.setAttribute("role", "button");
    closeButton.setAttribute(
      "aria-label",
      persistant
        ? "Close this notification"
        : "Notification will clear automatically"
    );
    closeButton.onclick = e => {
      const msgId = newMessageId;
      e.preventDefault();
      this._removeMessage(msgId);
    };
    messageContainer.appendChild(closeButton);

    parent.appendChild(messageContainer);

    if (!persistant) {
      setTimeout(() => {
        const messageIdToRemove = newMessageId;
        requestAnimationFrame(() => {
          this._removeMessage(messageIdToRemove);
        });
      }, 5000);
    }
  }

  _removeMessage(msgId) {
    const item = document.querySelector(
      `#notification-area .notification[data-messageid='${msgId}']`
    );

    if (item) {
      item.parentNode.removeChild(item);
    }
  }
}
