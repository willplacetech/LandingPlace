(() => {
  const credentialsKey = "placetech-admin-credentials-v1";
  const draftKey = "placetech-client-logos-draft-v1";
  const maxUploadBytes = 8 * 1024 * 1024;
  const maxLogos = 30;
  const outputWidth = 1200;
  const outputHeight = 420;
  const localAssetPattern =
    /^assets\/client-logos\/[a-z0-9._-]+\.(?:png|jpe?g|webp|svg)$/i;
  const dataImagePattern =
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/]+=*$/i;

  const setupForm = document.querySelector("#setup-form");
  const loginForm = document.querySelector("#login-form");
  const authStatus = document.querySelector("#auth-status");
  const authSection = document.querySelector("#auth-section");
  const editor = document.querySelector("#editor");
  const logoForm = document.querySelector("#logo-form");
  const nameInput = document.querySelector("#logo-name");
  const fileInput = document.querySelector("#logo-file");
  const preview = document.querySelector("#logo-preview");
  const previewImage = document.querySelector("#preview-image");
  const logoList = document.querySelector("#logo-list");
  const logoCount = document.querySelector("#logo-count");
  const editorStatus = document.querySelector("#editor-status");
  const addButton = document.querySelector("#add-logo");
  const downloadButton = document.querySelector("#download-manifest");
  const logoutButton = document.querySelector("#logout");

  let publishedVersion = 0;
  let publishedLogos = [];
  let logos = [];
  let isDirty = false;
  let previewUrl = null;

  function setStatus(element, message, state = "") {
    element.textContent = message;
    if (state) element.dataset.state = state;
    else delete element.dataset.state;
  }

  function encodeBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function decodeBase64(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }

  function bytesToHex(bytes) {
    return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 180000, hash: "SHA-256" },
      key,
      256
    );
    return bytesToHex(new Uint8Array(bits));
  }

  function constantTimeEqual(left, right) {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
      difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
  }

  function validateLogos(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > maxLogos) {
      throw new TypeError("O manifesto deve conter de 1 a 30 logos.");
    }

    return value.map((logo) => {
      if (
        !logo ||
        typeof logo.name !== "string" ||
        logo.name.trim().length < 1 ||
        logo.name.length > 80 ||
        typeof logo.src !== "string" ||
        (!localAssetPattern.test(logo.src) && !dataImagePattern.test(logo.src))
      ) {
        throw new TypeError("Há um logo inválido no manifesto.");
      }

      return { name: logo.name.trim(), src: logo.src };
    });
  }

  function readCredentials() {
    try {
      const saved = localStorage.getItem(credentialsKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      setStatus(authStatus, "Não foi possível acessar o armazenamento local deste navegador.", "error");
      console.error("Admin credentials could not be read.", error);
      return false;
    }
  }

  function showGate() {
    authSection.hidden = false;
    editor.hidden = true;
    const credentials = readCredentials();
    if (credentials === false) return;

    setupForm.hidden = Boolean(credentials);
    loginForm.hidden = !credentials;
    setStatus(authStatus, "");
  }

  async function loadCatalog() {
    const response = await fetch("assets/client-logos.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`O manifesto não pôde ser carregado (HTTP ${response.status}).`);
    }

    const manifest = await response.json();
    if (
      !Number.isInteger(manifest.version) ||
      manifest.version < 1 ||
      !Array.isArray(manifest.logos)
    ) {
      throw new TypeError("O manifesto publicado tem formato inválido.");
    }

    publishedVersion = manifest.version;
    publishedLogos = validateLogos(manifest.logos);
    logos = publishedLogos;
    isDirty = false;

    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft.baseVersion === publishedVersion) {
          logos = validateLogos(draft.logos);
          isDirty = JSON.stringify(logos) !== JSON.stringify(publishedLogos);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch (error) {
      throw new Error("O rascunho local não pôde ser lido. Limpe os dados do site e tente novamente.", { cause: error });
    }

    renderCatalog();
    editor.hidden = false;
    authSection.hidden = true;
  }

  function renderCatalog() {
    logoList.replaceChildren();

    logos.forEach(({ name, src }, index) => {
      const row = document.createElement("li");
      row.className = "logo-row";
      row.dataset.index = String(index);

      const image = document.createElement("img");
      image.src = src;
      image.alt = "";
      image.width = 145;
      image.height = 72;

      const details = document.createElement("div");
      const label = document.createElement("span");
      label.className = "logo-row-name";
      label.textContent = name;

      const source = document.createElement("span");
      source.className = "logo-row-source";
      source.textContent = src.startsWith("data:image/") ? "Imagem enviada neste navegador" : "Imagem do projeto";

      const text = document.createElement("div");
      text.className = "logo-row-text";
      text.append(label, source);

      const orderActions = document.createElement("div");
      orderActions.className = "logo-row-actions";
      [
        { direction: "up", title: "Subir", disabled: index === 0 },
        { direction: "down", title: "Descer", disabled: index === logos.length - 1 },
      ].forEach(({ direction, title, disabled }) => {
        const button = document.createElement("button");
        button.className = "logo-order-button";
        button.type = "button";
        button.dataset.move = direction;
        button.dataset.index = String(index);
        button.disabled = disabled;
        button.setAttribute("aria-label", `${title} ${name} na ordem do carrossel`);
        button.textContent = title;
        orderActions.append(button);
      });

      details.append(text, orderActions);
      row.append(image, details);
      logoList.append(row);
    });

    logoCount.textContent = `${logos.length} de ${maxLogos} logos`;
    downloadButton.disabled = !isDirty;
  }

  function saveDraft(nextLogos) {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ baseVersion: publishedVersion, logos: nextLogos })
      );
      return true;
    } catch (error) {
      setStatus(editorStatus, "Não foi possível salvar o rascunho. Reduza o tamanho dos arquivos ou libere espaço no armazenamento do navegador.", "error");
      console.error("Client logo draft could not be saved.", error);
      return false;
    }
  }

  logoList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-move]");
    if (!button) return;

    const index = Number(button.dataset.index);
    const nextIndex = index + (button.dataset.move === "up" ? -1 : 1);
    if (
      !Number.isInteger(index) ||
      nextIndex < 0 ||
      nextIndex >= logos.length
    ) {
      return;
    }

    const nextLogos = [...logos];
    [nextLogos[index], nextLogos[nextIndex]] = [
      nextLogos[nextIndex],
      nextLogos[index],
    ];
    if (!saveDraft(nextLogos)) return;

    logos = nextLogos;
    isDirty = JSON.stringify(logos) !== JSON.stringify(publishedLogos);
    renderCatalog();
    const movedRow = logoList.querySelector(`.logo-row[data-index="${nextIndex}"] .logo-row-name`);
    movedRow.tabIndex = -1;
    movedRow.focus();
    setStatus(editorStatus, `${logos[nextIndex].name} agora está na posição ${nextIndex + 1}.`, "success");
  });

  function releasePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.hidden = true;
    previewImage.removeAttribute("src");
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error("O arquivo não contém uma imagem válida."));
          return;
        }
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível abrir a imagem selecionada."));
      };
      image.src = objectUrl;
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível preparar o arquivo para exportação."));
      reader.readAsDataURL(blob);
    });
  }

  async function normalizeImage(file) {
    const image = await loadImage(file);
    if (image.naturalWidth > 10000 || image.naturalHeight > 10000) {
      throw new Error("A imagem excede as dimensões máximas de 10.000 × 10.000 px.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador não conseguiu preparar a imagem.");

    const scale = Math.min(
      1,
      1090 / image.naturalWidth,
      310 / image.naturalHeight
    );
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    context.drawImage(
      image,
      Math.round((outputWidth - width) / 2),
      Math.round((outputHeight - height) / 2),
      width,
      height
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.88);
    });
    if (!blob) throw new Error("A imagem não pôde ser convertida para exportação.");
    return blobToDataUrl(blob);
  }

  function clearPasswordFields() {
    document.querySelector("#setup-password").value = "";
    document.querySelector("#setup-confirmation").value = "";
    document.querySelector("#login-password").value = "";
  }

  setupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = setupForm.elements.password.value;
    const confirmation = setupForm.elements.confirmation.value;
    if (password.length < 8) {
      setStatus(authStatus, "Use uma senha com pelo menos 8 caracteres.", "error");
      return;
    }
    if (password !== confirmation) {
      setStatus(authStatus, "As senhas não coincidem. Confira os dois campos.", "error");
      return;
    }
    if (!crypto?.subtle) {
      setStatus(authStatus, "A criptografia deste navegador não está disponível. Abra o painel em um endereço HTTPS.", "error");
      return;
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const credentials = {
        version: 1,
        salt: encodeBase64(salt),
        hash: await hashPassword(password, salt),
      };
      localStorage.setItem(credentialsKey, JSON.stringify(credentials));
      clearPasswordFields();
      setStatus(authStatus, "Senha criada neste navegador.", "success");
      await loadCatalog();
    } catch (error) {
      setStatus(authStatus, error.message || "Não foi possível criar o acesso.", "error");
      console.error("Admin setup failed.", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const credentials = readCredentials();
      if (!credentials || credentials === false) return;
      if (
        credentials.version !== 1 ||
        typeof credentials.salt !== "string" ||
        typeof credentials.hash !== "string"
      ) {
        throw new TypeError("O registro local da senha está inválido.");
      }
      const password = loginForm.elements.password.value;
      const computedHash = await hashPassword(password, decodeBase64(credentials.salt));
      clearPasswordFields();
      if (!constantTimeEqual(computedHash, credentials.hash)) {
        setStatus(authStatus, "Senha incorreta. Tente novamente.", "error");
        return;
      }
      await loadCatalog();
    } catch (error) {
      setStatus(authStatus, error.message || "Não foi possível validar a senha.", "error");
      console.error("Admin login failed.", error);
    }
  });

  fileInput.addEventListener("change", () => {
    releasePreview();
    const [file] = fileInput.files || [];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      fileInput.value = "";
      setStatus(editorStatus, "Formato não aceito. Escolha um arquivo PNG, JPG ou WebP.", "error");
      return;
    }
    if (file.size > maxUploadBytes) {
      fileInput.value = "";
      setStatus(editorStatus, "O arquivo ultrapassa o limite de 8 MB.", "error");
      return;
    }

    previewUrl = URL.createObjectURL(file);
    previewImage.src = previewUrl;
    preview.hidden = false;
    setStatus(editorStatus, "");
  });

  logoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const [file] = fileInput.files || [];
    const name = nameInput.value.trim();
    if (!file || !name) return;
    if (logos.length >= maxLogos) {
      setStatus(editorStatus, "O catálogo atingiu o limite de 30 logos.", "error");
      return;
    }
    if (logos.some((logo) => logo.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      setStatus(editorStatus, "Esse nome já está no catálogo. Use um nome diferente.", "error");
      return;
    }

    addButton.disabled = true;
    addButton.textContent = "Preparando imagem…";
    setStatus(editorStatus, "");
    try {
      const nextLogos = [...logos, { name, src: await normalizeImage(file) }];
      if (!saveDraft(nextLogos)) return;
      logos = nextLogos;
      isDirty = JSON.stringify(logos) !== JSON.stringify(publishedLogos);
      renderCatalog();
      logoForm.reset();
      releasePreview();
      setStatus(editorStatus, `${name} foi adicionado ao rascunho local. Baixe o manifesto para publicar.`, "success");
    } catch (error) {
      setStatus(editorStatus, error.message || "Não foi possível processar a imagem.", "error");
      console.error("Client logo upload failed.", error);
    } finally {
      addButton.disabled = false;
      addButton.textContent = "Adicionar ao catálogo";
    }
  });

  downloadButton.addEventListener("click", () => {
    try {
      const manifest = { version: publishedVersion + 1, logos };
      const content = JSON.stringify(manifest, null, 2);
      const url = URL.createObjectURL(
        new Blob([content], { type: "application/json;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "client-logos.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(editorStatus, "Manifesto baixado. Substitua assets/client-logos.json e publique o site.", "success");
    } catch (error) {
      setStatus(editorStatus, "O manifesto não pôde ser exportado. Tente novamente.", "error");
      console.error("Client logo manifest export failed.", error);
    }
  });

  logoutButton.addEventListener("click", () => {
    clearPasswordFields();
    editor.hidden = true;
    showGate();
    setStatus(authStatus, "Você saiu do painel.");
  });

  showGate();
})();
