const dataset = {
  topics: {
    "Biologi": {
      description: "Mari eksplorasi dunia makhluk hidup, dari sel hingga ekosistem!",
      subtopics: {
        "Sel": {
          description: "Unit terkecil kehidupan yang penuh keajaiban.",
          QnA: [
            {
              // Pertanyaan dasar
              patterns: ["apa itu sel", "definisi sel", "jelaskan tentang sel"],
              responses: [
                "Sel adalah unit terkecil penyusun makhluk hidup. Bayangkan seperti bata penyusun gedung kehidupan! 🧱",
                "Setiap makhluk hidup terdiri dari sel. Ada yang hanya satu sel (uniseluler) seperti bakteri, ada yang triliunan sel seperti manusia. 🤯"
              ],
              diagram: "images/sel.png",
              // Konteks tambahan untuk human touch
              funFact: "Tahukah kamu? Tubuh manusia memiliki sekitar 30 triliun sel!",
              followUpQuestions: [
                "Apa perbedaan sel hewan dan tumbuhan?",
                "Bagaimana struktur sel?"
              ]
            },
            {
              // Pertanyaan lanjutan
              patterns: ["bagaimana struktur sel", "bagian-bagian sel"],
              responses: [
                `Sel terdiri dari:
                <ul>
                  <li>📌 <b>Membran sel</b>: Pelindung dan pengatur keluar-masuk zat</li>
                  <li>📌 <b>Sitoplasma</b>: Cairan tempat organel mengambang</li>
                  <li>📌 <b>Inti sel</b>: "Otak" sel yang menyimpan DNA</li>
                </ul>`,
                "Bayangkan sel seperti kota mini! 🏙️ Inti sel adalah balai kota, mitokondria pembangkit listrik, dan ribosom pabrik protein."
              ],
              diagram: "images/struktur-sel.png"
            }
          ]
        }
      }
    },
    "Fisika": {
      description: "Temukan hukum-hukum alam yang mengatur semesta!",
      subtopics: {
        "Gaya": {
          description: "Interaksi yang membuat benda bergerak atau diam.",
          QnA: [
            {
              patterns: ["apa itu gaya", "contoh gaya dalam fisika"],
              responses: [
                "Gaya adalah tarikan atau dorongan yang mengubah gerak benda. Contoh sehari-hari: 💨 Angin mendorong layang-layang, 🍎 Gravitasi menarik apel jatuh!",
                "Gaya itu seperti tangan tak terlihat yang menggerakkan benda. Tanpa gaya, bola tidak akan pernah berhenti menggelinding! ⚽"
              ],
              analogy: "Seperti ketika kamu mendorong troli belanjaan—semakin kuat doronganmu, semakin cepat trolinya bergerak! 🛒"
            }
          ]
        }
      }
    }
  },
  // ===== RESPONSES GLOBAL ===== //
  greetings: {
    patterns: ["halo", "hai", "selamat pagi"],
    responses: [
      "Halo! Ada yang bisa saya bantu tentang IPA hari ini? 😊",
      "Selamat datang di Teman Belajar IPA! Mau tanya apa? 📚"
    ]
  },
  compliments: {
    patterns: ["terima kasih", "kamu membantu", "keren"],
    responses: [
      "Senang bisa membantu! Semangat belajar ya~ 🌟",
      "Terima kasih kembali! Kalau ada pertanyaan lagi, saya siap membantu."
    ]
  }
};