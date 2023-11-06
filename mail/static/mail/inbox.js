document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //submit handling
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-content').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        // Print email
        console.log(email);

        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#email-content').style.display = 'block';

        //show email details
        document.querySelector('#email-content').innerHTML = `
        <ul class="list-group">
          <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
          <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
          <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
          <li class="list-group-item"><strong>Date:</strong> ${email.timestamp}</li>
          <li class="list-group-item"> ${email.body}</li>
        </ul>
        `;

        // Change to read
        if (!email.read) {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          })
        }

        // Archive/Unarchive button and logic
        const btn_arch = document.createElement('button');
        btn_arch.innerHTML = email.archived ? "Unarchive" : "Archive";
        btn_arch.classList = email.archived ? "btn arch btn-success" : "btn arch btn-danger";
        btn_arch.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
          })
          .then(() => {load_mailbox('archive')})

        });
        document.querySelector('#email-content').append(btn_arch);

        // Reply logic
        const btn_reply = document.createElement('button');
        btn_reply.innerHTML = "Reply";
        btn_reply.classList = "btn reply btn-info px-2";
        btn_reply.addEventListener('click', function() {
          compose_email();

          document.querySelector('#compose-recipients').value = email.sender;
          let subject = email.subject;
          if (subject.split(' ', 1)[0] != "Re:"){
            subject = "Re: " + email.subject
          }
          document.querySelector('#compose-subject').value = subject;
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
        });
        document.querySelector('#email-content').append(btn_reply);

    });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails for mailbox and user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Loop through emails and create a div for each email
      emails.forEach(singleEmail => {

        console.log(singleEmail);

        // Create div for each email
        const newEmail = document.createElement('div');
        newEmail.className = "list-group-item";
        if (mailbox === 'sent') {
          newEmail.innerHTML = `
            <div class="email-item">
              <P><strong>To:</strong> ${singleEmail.recipients.join(', ')}</P>
              <p><strong>Subject:</strong> ${singleEmail.subject}</p>
              <p>${singleEmail.timestamp}</p>
            </div>
          `;
        }else{
          newEmail.innerHTML = `
          <div class="email-item">
            <p><strong>From:</strong> ${singleEmail.sender}</p>
            <p><strong>Subject:</strong> ${singleEmail.subject}</p>
            <p>${singleEmail.timestamp}</p>
          </div>
          `;
        }
        // Change background color
        newEmail.className = singleEmail.read ? 'read' : 'unread';

        // Add a click event to view email
        newEmail.addEventListener('click', function(){
          view_email(singleEmail.id)
        });
        document.querySelector('#emails-view').append(newEmail);
      });

      // ... do something else with emails ...
  });
}

function send_email(event) {
  event.preventDefault();

  // store fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Sending data to the backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}
