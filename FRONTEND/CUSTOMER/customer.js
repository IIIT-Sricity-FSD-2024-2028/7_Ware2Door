const cards = document.querySelectorAll(".card-2");
for (const card of cards) {
    card.addEventListener("click", () => {
        window.location.href = "faq.html";
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const contactUsBtn = document.getElementById("contactUsBtn");
    const contactDropdown = document.getElementById("contactDropdown");

    if (contactUsBtn && contactDropdown) {
        contactUsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShowing = contactDropdown.style.opacity === "1";
            
            if (isShowing) {
                contactDropdown.style.opacity = "0";
                contactDropdown.style.visibility = "hidden";
                contactDropdown.style.transform = "translateY(-10px)";
                contactDropdown.style.pointerEvents = "none";
            } else {

                contactDropdown.style.visibility = "visible";
                contactDropdown.style.opacity = "1";
                contactDropdown.style.transform = "translateY(0)";
                contactDropdown.style.pointerEvents = "auto";
            }
        });
        document.addEventListener("click", (e) => {
            if (contactDropdown.style.opacity === "1" && !contactDropdown.contains(e.target) && e.target !== contactUsBtn) {
                contactDropdown.style.opacity = "0";
                contactDropdown.style.visibility = "hidden";
                contactDropdown.style.transform = "translateY(-10px)";
                contactDropdown.style.pointerEvents = "none";
            }
        });
        contactDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }
});
