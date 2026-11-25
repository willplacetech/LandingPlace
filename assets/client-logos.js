(() => {
  const manifestUrl = "assets/client-logos.json";
  const draftKey = "placetech-client-logos-draft-v1";
  const localAssetPattern =
    /^assets\/client-logos\/[a-z0-9._-]+\.(?:png|jpe?g|webp|svg)$/i;
  const dataImagePattern =
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/]+=*$/i;

  function validateManifest(value) {
    if (
      !value ||
      !Number.isInteger(value.version) ||
      value.version < 1 ||
      !Array.isArray(value.logos) ||
      value.logos.length < 1 ||
      value.logos.length > 30
    ) {
      throw new TypeError("Invalid client logo manifest.");
    }

    const logos = value.logos.map((logo) => {
      if (
        !logo ||
        typeof logo.name !== "string" ||
        logo.name.trim().length < 1 ||
        logo.name.length > 80 ||
        typeof logo.src !== "string" ||
        (!localAssetPattern.test(logo.src) && !dataImagePattern.test(logo.src))
      ) {
        throw new TypeError("Invalid client logo entry.");
      }

      return { name: logo.name.trim(), src: logo.src };
    });

    return { version: value.version, logos };
  }

  function readDraft(version) {
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (!rawDraft) return null;

      const draft = JSON.parse(rawDraft);
      if (draft.baseVersion !== version) return null;
      return validateManifest({ version, logos: draft.logos }).logos;
    } catch (error) {
      console.error("The local client logo draft could not be read.", error);
      return null;
    }
  }

  function renderList(list, logos) {
    const fragment = document.createDocumentFragment();

    logos.forEach(({ name, src }) => {
      const item = document.createElement("li");
      item.className = "client-logo";

      const image = document.createElement("img");
      image.src = src;
      image.alt = "";
      image.width = 145;
      image.height = 72;
      image.decoding = "async";

      const label = document.createElement("span");
      label.className = "client-name";
      label.textContent = name;

      item.append(image, label);
      fragment.append(item);
    });

    list.replaceChildren(fragment);
  }

  function waitForImage(image) {
    if (image.complete) {
      return image.naturalWidth > 0
        ? typeof image.decode === "function"
          ? image.decode()
          : Promise.resolve()
        : Promise.reject(new Error(`Unable to load client logo: ${image.src}`));
    }

    return new Promise((resolve, reject) => {
      image.addEventListener(
        "load",
        () => {
          if (typeof image.decode === "function") {
            image.decode().then(resolve, reject);
          } else {
            resolve();
          }
        },
        { once: true }
      );
      image.addEventListener(
        "error",
        () => reject(new Error(`Unable to load client logo: ${image.src}`)),
        { once: true }
      );
    });
  }

  async function loadPublishedManifest() {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Logo manifest request failed: ${response.status}`);
    }
    return validateManifest(await response.json());
  }

  async function initializeCarousels() {
    const carousels = [...document.querySelectorAll(".client-carousel")];
    if (carousels.length === 0) return;

    let manifest = null;
    try {
      manifest = await loadPublishedManifest();
    } catch (error) {
      console.warn("The published client logo manifest could not be loaded.", error);
    }

    await Promise.all(
      carousels.map(async (carousel) => {
        const track = carousel.querySelector(".client-track");
        const list = track?.querySelector('.client-list:not([aria-hidden="true"])');
        if (!track || !list) return;

        const fallbackVersion = Number(carousel.dataset.manifestVersion) || 1;
        const version = manifest?.version || fallbackVersion;
        const logos = readDraft(version) || manifest?.logos;
        if (logos) renderList(list, logos);

        const duplicate = list.cloneNode(true);
        duplicate.setAttribute("aria-hidden", "true");
        track.replaceChildren(list, duplicate);

        try {
          await Promise.all([...list.querySelectorAll("img")].map(waitForImage));
          carousel.classList.add("is-running");
        } catch (error) {
          console.error("Client carousel logos could not be loaded.", error);
        }
      })
    );
  }

  void initializeCarousels();
})();
