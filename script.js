(function () {
  var $ = function (id) { return document.getElementById(id); };

  // Adresse e-mail qui reçoit les avis sur le site (à compléter, entre les guillemets).
  var FEEDBACK_EMAIL = "avisio.nono@gmail.com";

  // ---------- Navigation (une seule page, plusieurs vues) ----------
  var current = "home";
  function showView(name) {
    document.querySelectorAll("[data-view]").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-view").split(" ").indexOf(name) !== -1);
    });
    document.querySelectorAll("nav.main button").forEach(function (b) {
      if (b.getAttribute("data-go") === name) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    current = name;
    window.scrollTo(0, 0);
  }
  document.querySelectorAll("[data-go]").forEach(function (el) {
    el.addEventListener("click", function () { showView(el.getAttribute("data-go")); });
  });
  showView("home");

  // ---------- Démo téléphone ----------
  var phoneMsgs = {
    1:"<strong>Merci de nous le dire.</strong> Une question privée s'ouvre pour savoir ce qui n'a pas été.",
    2:"<strong>Merci de nous le dire.</strong> Une question privée s'ouvre pour savoir ce qui n'a pas été.",
    3:"<strong>Merci.</strong> On vous demande en un mot comment s'améliorer.",
    4:"<strong>Merci !</strong> Un bouton vous envoie vers la fiche Google pour publier l'avis.",
    5:"<strong>Merci !</strong> Un bouton vous envoie vers la fiche Google pour publier l'avis."
  };
  var starBtns = document.querySelectorAll(".stars-pick button");
  starBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var n = +b.dataset.n;
      starBtns.forEach(function (x) { x.classList.toggle("on", +x.dataset.n <= n); });
      $("phoneOut").innerHTML = phoneMsgs[n];
    });
  });

  // ---------- Exemple de réponse ----------
  var cases = {
    good:{ who:"Camille D.", stars:5, text:"Super accueil, coupe parfaite et très bon conseil. Je reviendrai !",
      reply:"Bonjour Camille,\nMerci beaucoup pour ce message, il nous fait vraiment plaisir. Nous sommes ravis que la coupe vous plaise et nous serons heureux de vous revoir très bientôt.\nL'équipe de Coiffure Martin" },
    bad:{ who:"Julien R.", stars:2, text:"J'ai attendu 40 minutes alors que j'avais un rendez-vous. Dommage.",
      reply:"Bonjour Julien,\nMerci d'avoir pris le temps de nous écrire, et toutes nos excuses pour cette attente : elle n'aurait pas dû arriver avec un rendez-vous. Nous allons en parler en équipe pour mieux caler nos horaires. Si vous le souhaitez, appelez-nous et nous vous proposerons un geste lors de votre prochaine visite.\nL'équipe de Coiffure Martin" }
  };
  var curCase = "good";
  function showCase(k) {
    curCase = k; var c = cases[k];
    $("rvWho").textContent = c.who;
    $("rvStars").textContent = "★★★★★".slice(0,c.stars) + "☆☆☆☆☆".slice(0,5-c.stars);
    $("rvText").textContent = c.text;
    $("reviewCard").classList.toggle("bad", k === "bad");
    var rp = $("rpText"); rp.textContent = "Cliquez sur le bouton pour voir la réponse."; rp.classList.add("empty");
    document.querySelectorAll(".demo-tabs button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset["case"] === k ? "true" : "false"); });
  }
  document.querySelectorAll(".demo-tabs button").forEach(function (b) { b.addEventListener("click", function () { showCase(b.dataset["case"]); }); });
  $("genBtn").addEventListener("click", function () { var rp = $("rpText"); rp.textContent = cases[curCase].reply; rp.classList.remove("empty"); });
  showCase("good");

  // ---------- Affiche QR ----------
  function updateFind() {
    var q = ($("shop").value.trim() + " " + $("city").value.trim()).trim(), a = $("findMaps");
    if (q) { a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); a.removeAttribute("aria-disabled"); }
    else { a.href = "#"; a.setAttribute("aria-disabled", "true"); }
  }
  ["shop", "city"].forEach(function (id) { $(id).addEventListener("input", updateFind); });
  $("findMaps").addEventListener("click", function (e) {
    if (this.getAttribute("aria-disabled") === "true") { e.preventDefault(); $("findErr").textContent = "Écrivez d'abord le nom du commerce et sa ville."; }
    else { $("findErr").textContent = ""; }
  });
  updateFind();

  function toUrl(input) {
    var s = (input || "").trim(); if (!s) return null;
    if (/^ChIJ[\w-]{10,}$/.test(s)) return "https://search.google.com/local/writereview?placeid=" + s;
    if (/^https:\/\/(search\.google\.com|www\.google\.(com|fr)|maps\.google\.(com|fr)|g\.page|maps\.app\.goo\.gl|g\.co|goo\.gl)\//.test(s)) return s;
    return null;
  }

  document.querySelectorAll("#swatches .sw").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelector(".poster").style.setProperty("--pc", b.dataset.c);
      document.querySelectorAll("#swatches .sw").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    });
  });

  $("make").addEventListener("click", function () {
    var err = $("err"); err.textContent = "";
    var url = toUrl($("link").value), name = $("shop").value.trim();
    if (!url) { err.textContent = "Le lien n'est pas reconnu. Collez un lien Google (google.com, g.page...) ou un identifiant qui commence par ChIJ."; return; }
    if (typeof qrcode !== "function") { err.textContent = "Le générateur de QR code n'a pas pu se charger. Vérifiez votre connexion et rechargez la page."; return; }
    try { var qr = qrcode(0, "M"); qr.addData(url); qr.make(); $("pQr").src = qr.createDataURL(10, 2); }
    catch (e) { err.textContent = "Impossible de créer le QR code avec ce lien."; return; }
    $("pShop").textContent = name;
    $("preview").style.display = "block";
    $("preview").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("print").addEventListener("click", function () { window.print(); });

  // ---------- SMS ----------
  var bodyEdited = false;
  function buildBody() {
    var name = $("cName").value.trim(), shop = $("shop").value.trim(), url = toUrl($("link").value);
    return "Bonjour" + (name ? " " + name : "") + ", merci d'être passé" + (shop ? " chez " + shop : "") +
      " ! Si vous avez 30 secondes, votre avis sur Google nous aide beaucoup : " + (url || "(le lien apparaîtra ici)");
  }
  function normPhone(v) {
    var d = (v || "").replace(/[^\d+]/g, "");
    if (/^0\d{9}$/.test(d)) return "+33" + d.slice(1);
    if (/^(\+|00)?\d{8,15}$/.test(d)) return d.indexOf("00") === 0 ? "+" + d.slice(2) : d;
    return null;
  }
  function refreshSms() {
    if (!bodyEdited) $("smsBody").value = buildBody();
    var phone = normPhone($("cPhone").value), url = toUrl($("link").value), a = $("smsGo");
    if (phone && url) {
      a.href = "sms:" + phone + "?&body=" + encodeURIComponent($("smsBody").value);
      a.removeAttribute("aria-disabled");
      $("smsErr").textContent = "";
    } else { a.href = "#"; a.setAttribute("aria-disabled", "true"); }
  }
  ["shop","link","cName","cPhone"].forEach(function (id) { $(id).addEventListener("input", refreshSms); });
  $("smsBody").addEventListener("input", function () { bodyEdited = true; refreshSms(); });
  $("smsGo").addEventListener("click", function (e) {
    if (this.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      $("smsErr").textContent = !toUrl($("link").value) ? "Ajoutez d'abord un lien Google valide (en haut)." : "Entrez un numéro de téléphone valide.";
    }
  });
  function copyFrom(textarea, btn, label) {
    var done = function () { btn.textContent = "Copié !"; setTimeout(function () { btn.textContent = label; }, 2000); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(textarea.value).then(done, function () { textarea.select(); }); return; } } catch (e) {}
    textarea.focus(); textarea.select();
    try { if (document.execCommand("copy")) done(); } catch (e) {}
  }
  $("smsCopy").addEventListener("click", function () { copyFrom($("smsBody"), this, "Copier le message"); });
  refreshSms();

  // ---------- Réponses : métiers ----------
  // [clé, libellé, "votre …" (objet), lieu, phrase "revoir" facultative]
  var METIERS = [
    ["Beauté et bien-être", [
      ["coiffeur","Salon de coiffure"], ["institut","Institut de beauté"],
      ["barbier","Barbier","votre coupe","au salon"], ["onglerie","Onglerie","votre manucure","chez nous"],
      ["spa","Spa / massage","votre moment de détente","au spa"], ["tatouage","Tatouage / piercing","votre réalisation","au studio"],
      ["parfumerie","Parfumerie","votre achat","à la parfumerie"]
    ]],
    ["Restauration et alimentation", [
      ["resto","Restaurant"],
      ["cafe","Café / bar / brasserie","votre moment","chez nous"], ["snack","Restauration rapide / pizzeria","votre repas","chez nous"],
      ["boulangerie","Boulangerie-pâtisserie","votre commande","à la boulangerie"], ["boucherie","Boucherie-charcuterie","votre commande","à la boucherie"],
      ["poissonnerie","Poissonnerie","votre commande","à la poissonnerie"], ["fromagerie","Fromagerie-crémerie","votre sélection","à la fromagerie"],
      ["primeur","Primeur (fruits et légumes)","votre panier","chez nous"], ["epicerie","Épicerie fine","votre sélection","à l'épicerie"],
      ["superette","Supérette / supermarché","votre visite","dans notre magasin"], ["cave","Cave à vins / caviste","votre sélection","à la cave"],
      ["traiteur","Traiteur","votre commande","chez nous"], ["chocolat","Chocolaterie / confiserie","votre sélection","à la chocolaterie"],
      ["glacier","Glacier","votre dégustation","chez nous"]
    ]],
    ["Mode, maison et loisirs", [
      ["vetements","Boutique de vêtements","votre achat","à la boutique"], ["chaussures","Chaussures","votre achat","à la boutique"],
      ["bijouterie","Bijouterie","votre achat","à la bijouterie"], ["maroquinerie","Maroquinerie","votre achat","à la boutique"],
      ["opticien","Opticien","votre nouvelle monture","au magasin"], ["fleuriste","Fleuriste","votre bouquet","à la boutique"],
      ["deco","Décoration / maison","votre achat","à la boutique"], ["meubles","Meubles","votre achat","au magasin"],
      ["librairie","Librairie / papeterie","votre achat","à la librairie"], ["jouets","Jouets","votre achat","à la boutique"],
      ["cadeaux","Cadeaux / souvenirs","votre achat","à la boutique"], ["sport","Magasin de sport","votre achat","au magasin"],
      ["animalerie","Animalerie","votre achat","à l'animalerie"], ["jardinerie","Jardinerie","votre achat","à la jardinerie"],
      ["bricolage","Quincaillerie / bricolage","votre achat","au magasin"], ["electromenager","Électroménager","votre achat","au magasin"],
      ["informatique","Informatique / téléphonie","votre achat","au magasin"], ["musique","Instruments de musique","votre achat","au magasin"],
      ["velo","Vélos / cycles","votre achat","à l'atelier"]
    ]],
    ["Auto et transport", [
      ["garage","Garage"],
      ["concession","Concession / vente de voitures","votre véhicule","à la concession"], ["carrosserie","Carrosserie","le travail réalisé","à l'atelier"],
      ["ct","Contrôle technique","votre visite","au centre"], ["pneus","Pneus / entretien rapide","le travail réalisé","au centre"],
      ["autoecole","Auto-école","votre formation","à l'auto-école"], ["location","Location de véhicules","votre location","à l'agence"]
    ]],
    ["Services", [
      ["pharmacie","Pharmacie","votre visite","à la pharmacie"], ["pressing","Pressing / laverie","votre commande","au pressing"],
      ["cordonnerie","Cordonnerie / clés","le travail réalisé","à l'atelier"], ["photographe","Photographe","votre séance","au studio"],
      ["immo","Agence immobilière","votre accompagnement","à l'agence"], ["voyages","Agence de voyages","votre voyage","à l'agence"],
      ["hotel","Hôtel / chambre d'hôtes","votre séjour","chez nous"], ["salle","Salle de sport","votre expérience","à la salle"],
      ["banque","Assurance / services financiers","votre accompagnement","à l'agence"]
    ]],
    ["Artisans à domicile", [
      ["plomberie","Plombier / chauffagiste","l'intervention","","vous accompagner de nouveau"],
      ["electricite","Électricien","l'intervention","","vous accompagner de nouveau"],
      ["peinture","Peintre / rénovation","le chantier","","vous accompagner dans vos prochains projets"],
      ["serrurerie","Serrurier","l'intervention","","vous aider de nouveau"],
      ["menuiserie","Menuisier","la réalisation","","vous accompagner dans vos prochains projets"],
      ["nettoyage","Nettoyage / entretien","le service","","vous retrouver bientôt"],
      ["jardinage","Paysagiste / jardinier","le travail réalisé","","vous accompagner de nouveau"]
    ]],
    ["Autre", [
      ["autre","Autre commerce","votre achat","chez nous"]
    ]]
  ];

  // Textes écrits à la main pour 4 métiers
  var R = {
    coiffeur: {
      pos: ["Merci beaucoup pour votre message, il nous fait très plaisir ! Nous sommes ravis que votre passage au salon vous ait plu et nous serons heureux de vous revoir bientôt.",
            "Un grand merci pour ce retour ! Savoir que votre coiffure vous plaît, c'est notre plus belle récompense. À très bientôt au salon."],
      mid: ["Merci d'avoir pris le temps de nous écrire. Nous sommes contents qu'une partie de votre visite vous ait plu, et nous aimerions savoir ce qui aurait pu être mieux. N'hésitez pas à nous en parler au salon ou par téléphone.",
            "Merci pour votre retour sincère. Nous voulons que chaque client reparte pleinement satisfait : dites-nous ce que nous pouvons améliorer, nous en tiendrons compte."],
      neg: ["Nous sommes sincèrement désolés que votre expérience n'ait pas été à la hauteur de vos attentes. Ce n'est pas ce que nous souhaitons pour nos clients. Pourriez-vous nous appeler afin que nous trouvions une solution ensemble ?",
            "Merci de nous avoir fait part de votre déception, nous la prenons très au sérieux. Nous aimerions en discuter avec vous et trouver une solution : n'hésitez pas à nous contacter."]
    },
    institut: {
      pos: ["Merci pour votre confiance et pour ce joli message. Nous sommes contents que le soin vous ait fait du bien, et nous serons ravis de vous accueillir à nouveau.",
            "Merci beaucoup pour votre avis, il nous touche. Prendre soin de vous est un plaisir, à très bientôt à l'institut."],
      mid: ["Merci pour votre avis. Nous sommes heureux que certains points vous aient plu et nous aimerions comprendre ce qui n'a pas été à la hauteur. N'hésitez pas à nous contacter pour en parler.",
            "Merci pour votre retour honnête, il nous aide à progresser. Nous serions ravis de vous accueillir à nouveau pour vous offrir une meilleure expérience."],
      neg: ["Nous sommes vraiment désolés que votre visite ne vous ait pas satisfait. Votre bien-être est notre priorité et nous aimerions comprendre ce qui s'est passé. Pourriez-vous nous contacter pour que nous trouvions une solution ?",
            "Merci pour votre retour, même s'il nous peine. Nous prenons votre remarque au sérieux et souhaitons en parler avec vous : n'hésitez pas à nous appeler."]
    },
    garage: {
      pos: ["Merci pour votre confiance et pour ce retour. Nous sommes heureux que vous soyez satisfait du travail réalisé sur votre véhicule. N'hésitez pas à revenir pour votre prochain entretien.",
            "Merci pour votre avis ! Un client satisfait, c'est ce qui compte pour nous. Nous restons à votre disposition pour la suite."],
      mid: ["Merci pour votre retour. Nous sommes contents que le travail ait répondu en partie à vos attentes, et nous aimerions savoir ce qui aurait pu être mieux. Vous pouvez nous appeler pour en discuter.",
            "Merci d'avoir pris le temps de nous écrire. Votre avis nous aide à améliorer notre service, n'hésitez pas à nous dire ce qui vous a manqué."],
      neg: ["Nous sommes désolés que vous ne soyez pas satisfait de notre intervention. Nous prenons votre avis très au sérieux et souhaitons comprendre la situation. Pourriez-vous nous appeler pour que nous regardions cela ensemble ?",
            "Merci de nous avoir écrit. Un client mécontent est toujours une alerte pour nous. Contactez-nous afin que nous puissions examiner votre dossier et trouver une solution."]
    },
    resto: {
      pos: ["Merci beaucoup pour votre message ! Nous sommes ravis que vous ayez passé un bon moment à notre table et nous serons heureux de vous accueillir de nouveau.",
            "Un grand merci pour ce retour, il fait plaisir à toute l'équipe. À très bientôt pour un nouveau repas !"],
      mid: ["Merci pour votre avis. Nous sommes contents que certains plats vous aient plu et nous aimerions savoir ce qui a manqué à votre expérience. N'hésitez pas à nous le dire lors de votre prochaine visite.",
            "Merci pour ce retour sincère. Nous voulons que chaque repas soit réussi : vos remarques nous aident à nous améliorer."],
      neg: ["Nous sommes sincèrement désolés que votre repas n'ait pas été à la hauteur. Ce n'est pas l'expérience que nous voulons offrir. Pourriez-vous nous contacter pour que nous puissions en parler et corriger cela ?",
            "Merci d'avoir pris le temps de nous écrire, nous prenons votre retour très au sérieux. Nous aimerions échanger avec vous pour comprendre ce qui s'est passé."]
    }
  };

  function generic(objet, revoir) {
    return {
      pos: ["Merci beaucoup pour votre message, il nous fait très plaisir ! Nous sommes ravis que " + objet + " vous ait plu et nous serons heureux de " + revoir + ".",
            "Un grand merci pour ce retour ! Savoir que " + objet + " vous a plu, c'est notre plus belle récompense. À très bientôt."],
      mid: ["Merci d'avoir pris le temps de nous écrire. Nous sommes contents que certains points aient répondu à vos attentes, et nous aimerions savoir ce qui aurait pu être mieux. N'hésitez pas à nous contacter pour en parler.",
            "Merci pour votre retour sincère. Nous voulons que chaque client reparte pleinement satisfait : dites-nous ce que nous pouvons améliorer, nous en tiendrons compte."],
      neg: ["Nous sommes sincèrement désolés que votre expérience n'ait pas été à la hauteur de vos attentes. Ce n'est pas ce que nous souhaitons pour nos clients. Pourriez-vous nous contacter afin que nous trouvions une solution ensemble ?",
            "Merci de nous avoir fait part de votre déception, nous la prenons très au sérieux. Nous aimerions en discuter avec vous et trouver une solution : n'hésitez pas à nous contacter."]
    };
  }

  var META = {};
  var sel = $("lMetier");
  METIERS.forEach(function (g) {
    var og = document.createElement("optgroup"); og.label = g[0];
    g[1].forEach(function (m) {
      META[m[0]] = m;
      var o = document.createElement("option"); o.value = m[0]; o.textContent = m[1]; og.appendChild(o);
    });
    sel.appendChild(og);
  });
  sel.value = "coiffeur";

  function replySet(key, tone) {
    if (R[key]) return R[key][tone];
    var m = META[key];
    var revoir = m[4] || ("vous accueillir à nouveau " + m[3]);
    return generic(m[2], revoir)[tone];
  }
  var variant = 0;
  function buildReply() {
    var set = replySet($("lMetier").value, $("lNote").value);
    var body = set[variant % set.length];
    var name = $("lName").value.trim();
    var sign = $("lSign").value.trim() || $("shop").value.trim() || "L'équipe";
    $("lOut").value = "Bonjour" + (name ? " " + name : "") + ",\n" + body + "\nCordialement,\n" + sign;
  }
  ["lMetier", "lNote"].forEach(function (id) { $(id).addEventListener("change", function () { variant = 0; buildReply(); }); });
  ["lName", "lSign", "shop"].forEach(function (id) { $(id).addEventListener("input", buildReply); });
  $("lAlt").addEventListener("click", function () { variant++; buildReply(); });
  $("lCopy").addEventListener("click", function () { copyFrom($("lOut"), this, "Copier la réponse"); });
  buildReply();

  // ---------- Calculateur ----------
  function num(v) { return parseFloat(String(v).replace(",", ".").trim()); }
  function fr(x) { return String(x).replace(".", ","); }
  function calc() {
    var box = $("cRes"), cur = num($("cCur").value), n = parseInt($("cN").value, 10), t = num($("cTarget").value), w = parseInt($("cWeek").value, 10);
    box.className = "resbox";
    if (isNaN(cur) || isNaN(n) || isNaN(t)) { box.style.display = "none"; return; }
    box.style.display = "block";
    if (cur < 1 || cur > 5 || n < 1) { box.classList.add("warn"); box.textContent = "Entrez une note entre 1 et 5 et au moins 1 avis."; return; }
    if (t <= cur) { box.classList.add("warn"); box.textContent = "Votre note actuelle est déjà égale ou supérieure à la note visée."; return; }
    if (t >= 5) { box.classList.add("warn"); box.textContent = "Avec des avis déjà reçus, 5,0 n'est pas atteignable. Visez par exemple 4,9."; return; }
    var x = Math.ceil(n * (t - cur) / (5 - t));
    var html = "<span class=\"big\">" + x + " avis 5 étoiles</span>pour passer de " + fr(cur) + " à " + fr(t) + ", si vous ne recevez aucun avis moins bon entre-temps.";
    if (!isNaN(w) && w > 0) {
      var weeks = Math.ceil(x / w);
      html += "<br>À " + w + " avis par semaine, comptez environ " + weeks + " semaine" + (weeks > 1 ? "s" : "") + ".";
    }
    box.innerHTML = html;
  }
  ["cCur", "cN", "cTarget", "cWeek"].forEach(function (id) { $(id).addEventListener("input", calc); });

  // ---------- Avis sur le site ----------
  var fbRating = 0;
  function fbMessage() {
    var lines = [];
    lines.push("Note : " + (fbRating ? fbRating + "/5" : "non donnée"));
    if ($("fbFeat").value) lines.push("Le plus utile : " + $("fbFeat").value);
    lines.push("Commentaire : " + ($("fbText").value.trim() || "(aucun)"));
    if ($("fbWho").value.trim()) lines.push("Métier et ville : " + $("fbWho").value.trim());
    return lines.join("\n");
  }
  function fbRefresh() {
    var a = $("fbGo");
    var filled = fbRating > 0 || $("fbText").value.trim().length > 0;
    if (!FEEDBACK_EMAIL) { $("fbNotice").style.display = "block"; a.href = "#"; a.setAttribute("aria-disabled", "true"); return; }
    if (filled) {
      a.href = "mailto:" + FEEDBACK_EMAIL + "?subject=" + encodeURIComponent("Avis sur Avisio") + "&body=" + encodeURIComponent(fbMessage());
      a.removeAttribute("aria-disabled");
      $("fbErr").textContent = "";
    } else { a.href = "#"; a.setAttribute("aria-disabled", "true"); }
  }
  document.querySelectorAll("#fbStars button").forEach(function (b) {
    b.addEventListener("click", function () {
      fbRating = +b.dataset.n;
      document.querySelectorAll("#fbStars button").forEach(function (x) { x.classList.toggle("on", +x.dataset.n <= fbRating); });
      fbRefresh();
    });
  });
  ["fbFeat", "fbText", "fbWho"].forEach(function (id) { $(id).addEventListener("input", fbRefresh); $(id).addEventListener("change", fbRefresh); });
  $("fbGo").addEventListener("click", function (e) {
    if (this.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      if (FEEDBACK_EMAIL) $("fbErr").textContent = "Donnez une note ou écrivez un commentaire avant d'envoyer.";
    }
  });
  $("fbCopy").addEventListener("click", function () {
    var btn = this, tmp = document.createElement("textarea");
    var text = fbMessage();
    var done = function () { btn.textContent = "Copié !"; setTimeout(function () { btn.textContent = "Copier mon avis"; }, 2000); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () {}); return; } } catch (e) {}
    tmp.value = text; document.body.appendChild(tmp); tmp.select();
    try { if (document.execCommand("copy")) done(); } catch (e) {}
    document.body.removeChild(tmp);
  });
  fbRefresh();
})();
