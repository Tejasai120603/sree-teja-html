(function () {
  var $ = function (s) { return document.querySelector(s); };
  document.getElementById("yr").textContent = new Date().getFullYear();

  /* Theme toggle (remembers choice) */
  $("#theme").addEventListener("click", function () {
    var dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
  });

  /* Hardware filter */
  var fb = document.querySelectorAll("#filters button");
  fb.forEach(function (b) {
    b.addEventListener("click", function () {
      fb.forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      document.querySelectorAll("#catalog article").forEach(function (a) {
        a.hidden = !(b.dataset.f === "all" || a.dataset.cat === b.dataset.f);
      });
    });
  });

  /* Quote form data (keep in sync with api/quote.js) */
  var SERVICES = [
    ["hardware", "Hardware Sales & Upgrades", "New, refurbished and custom workstations, component upgrades"],
    ["rental", "Workstation Rental", "Monthly leases, flexible or lock-in terms"],
    ["network", "Network & Storage", "Structured LAN, switches, routers, NAS, firewalls, VPNs"],
    ["servers", "On-Premises Servers", "Rack setup, Windows or Linux Server, Active Directory, virtualisation"],
    ["amc", "AMC & Support", "Monthly or annual maintenance contracts, diagnostics"],
    ["home", "Home & Work-From-Home Support", "Doorstep diagnostics and upgrades"]
  ];
  var G = /^\d{6,14}$/;
  var COUNTRIES = [["IN", "+91", /^[6-9]\d{9}$/], ["AE", "+971", G], ["US", "+1", /^\d{10}$/], ["GB", "+44", G], ["SG", "+65", /^\d{8}$/], ["AU", "+61", G], ["SA", "+966", G], ["QA", "+974", G]];
  var form = $("#qf"), f = {};
  ["name", "countryCode", "phone", "email", "service", "area", "details"].forEach(function (k) { f[k] = document.getElementById(k); });
  COUNTRIES.forEach(function (c) { f.countryCode.add(new Option(c[0] + " " + c[1], c[0])); });
  SERVICES.forEach(function (s) { f.service.add(new Option(s[1], s[0])); });

  var touched = {}, tried = false;
  var method = function () { return form.querySelector("input[name=contactMethod]:checked").value; };
  var digits = function () { return f.phone.value.replace(/[\s-]/g, ""); };

  function validate() {
    var e = {}, n = f.name.value.trim(), d = digits(), em = f.email.value.trim();
    var c = COUNTRIES.filter(function (x) { return x[0] === f.countryCode.value; })[0];
    if (!n) e.name = "Please enter your full name.";
    else if (!/^[A-Za-z\s]+$/.test(n)) e.name = "Use letters and spaces only. No numbers or symbols.";
    else if (n.length < 2) e.name = "Name must be at least 2 characters.";
    if (!d) e.phone = "Please enter your mobile number.";
    else if (!/^\d+$/.test(d)) e.phone = "Digits only. No letters or symbols.";
    else if (!c[2].test(d)) e.phone = c[0] === "IN" ? "Enter a 10 digit Indian mobile number starting with 6, 7, 8 or 9." : "Enter a valid mobile number for the selected country.";
    if (!em) e.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || em.length > 120) e.email = "Enter a valid email address, for example name@company.com.";
    return e;
  }

  function paint() {
    var e = validate();
    ["name", "phone", "email"].forEach(function (k) {
      var msg = (touched[k] || tried) ? e[k] : "";
      document.getElementById("e-" + k).textContent = msg || "";
      var el = f[k];
      if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
      if (k === "phone") document.getElementById("phone-wrap").classList.toggle("border-red-600", !!msg);
    });
    var s = SERVICES.filter(function (x) { return x[0] === f.service.value; })[0];
    $("#hint").textContent = s[2];
    var c = COUNTRIES.filter(function (x) { return x[0] === f.countryCode.value; })[0];
    var lines = ["Hello Sree Teja Media Technology,", "Name: " + (f.name.value.trim() || "..."), "Mobile: " + c[1] + " " + (digits() || "..."),
      "Email: " + (f.email.value.trim() || "..."), "Service: " + s[1]];
    if (f.area.value.trim()) lines.push("Area: " + f.area.value.trim());
    if (f.details.value.trim()) lines.push("Details: " + f.details.value.trim());
    lines.push("Preferred contact: " + method());
    $("#preview").textContent = lines.join("\n");
    return e;
  }

  function valid() {
    tried = true;
    var e = paint();
    if (Object.keys(e).length) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return false; }
    return true;
  }

  form.addEventListener("input", paint);
  form.addEventListener("change", paint);
  form.addEventListener("focusout", function (ev) { if (ev.target.name) { touched[ev.target.name] = true; paint(); } });
  paint();

  /* Buttons that jump to the form preselect the service */
  document.querySelectorAll("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () { f.service.value = a.dataset.service; paint(); });
  });

  /* Option B: WhatsApp */
  $("#wa").addEventListener("click", function () {
    if (!valid()) return;
    window.open("https://wa.me/919948671175?text=" + encodeURIComponent($("#preview").textContent), "_blank", "noopener");
  });

  /* Option A: email through /api/quote (Resend) */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var btn = $("#send"), status = $("#status");
    if (btn.disabled || !valid()) return;
    btn.disabled = true; $("#spin").hidden = false; $("#send-t").textContent = "Sending..."; status.textContent = "";
    fetch("/api/quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name.value.trim(), countryCode: f.countryCode.value, phone: digits(), email: f.email.value.trim(),
        service: f.service.value, area: f.area.value.trim(), details: f.details.value.trim(), contactMethod: method(), website: $("#website").value })
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function () { form.hidden = true; $("#success").hidden = false; form.reset(); touched = {}; tried = false; paint(); $("#success").scrollIntoView({ block: "nearest" }); })
      .catch(function () { status.textContent = "We could not send your request. Please try again, use WhatsApp, or call +91 99486 71175."; })
      .then(function () { btn.disabled = false; $("#spin").hidden = true; $("#send-t").textContent = "Submit Request to Team"; });
  });
  $("#again").addEventListener("click", function () { $("#success").hidden = true; form.hidden = false; });
})();
