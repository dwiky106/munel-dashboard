const API = "https:google.com/macros/s/AKfycbzfeBiSso6Ns1LZ_1vHUc4oUB-iCj3nUtum9qb6Rqa2sGTWdh1cNL82O9HUtoyEwIIU4w/exec";

let incomeChart;
let currentAction = "payout";
let fullChartData = {};
let lastTransactionData = {};
let pendingAction = null;
let pendingData = null;
let tipeSaldo = "";

// ================= LOAD DASHBOARD =================
async function loadDashboard(){

   showLoading();

  try{
    const res = await fetch(API);
    const data = await res.json();

    document.getElementById("totalProfit").innerText = data.totalProfit || 0;
    document.getElementById("online").innerText = data.online || 0;
    document.getElementById("cash").innerText = data.cash || 0;
    document.getElementById("totalSaldo").innerText = data.totalSaldo || 0;
    document.getElementById("totalHutang").innerText = data.totalHutang || 0;

    renderHutang(data.listHutang || []);
    fullChartData = {
    cash: data.historyCash || [],
    online: data.historyOnline || [],
    profit: data.historyProfit || []
};

    updateChartRange();

    window.lastProfitHistory = data.profitHistory || [];
  }
  catch(err){
    console.error("LoadDashboard Error:", err);
  }
  hideLoading();
}

// ================= MODAL PAYOUT =================
function openModal(){
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
}

// ================= TAMBAH SALDO =================
function openTambahSaldo(tipe){
  tipeSaldo = tipe;
  document.getElementById("modalSaldo").classList.remove("hidden");
}

function closeSaldo(){
  document.getElementById("modalSaldo").classList.add("hidden");
}

async function kirimSaldo(){

  const nominal = document.getElementById("nominalSaldo").value;

  if(!nominal){
    showPopup("Informasi","Di isi dulu dong nominalnya");
    return;
  }

  // Simpan data sementara
  pendingAction = "tambahSaldo";
  pendingData = {
    tipe: tipeSaldo,
    nominal: nominal
  };

  // Tutup modal tambah saldo
  document.getElementById("modalSaldo").classList.add("hidden");

  // Buka modal PIN
  document.getElementById("pinModal").classList.remove("hidden");
}

// ================= PAYOUT =================
async function kirimData(){

  const nama = document.getElementById("nama").value;
  const hp = document.getElementById("hp").value;
  const produk = document.getElementById("produk").value;
  const modal = document.getElementById("modalInput").value;
  const harga = document.getElementById("harga").value;
  const status = document.getElementById("status").value;

  // Simpan dulu data transaksi
  pendingAction = currentAction;
  pendingData = {
    nama,
    hp,
    produk,
    modal,
    harga,
    status
  };

  // Tutup modal transaksi
  document.getElementById("modal").classList.add("hidden");

  // Buka modal PIN
  document.getElementById("pinModal").classList.remove("hidden");
}

// ================= SET LUNAS =================
async function setLunas(id){

  const fd = new URLSearchParams();
  fd.append("action","setLunas");
  fd.append("id",id);

  try{
    await fetch(API,{
      method:"POST",
      body:fd
    });

    loadDashboard();
  }
  catch(err){
    console.error("SetLunas Error:", err);
  }
}

// ================= RENDER CHART =================
function renderChart(chartData){

  const canvas = document.getElementById("incomeChart");
  if(!canvas) return;

  const labels = Object.keys(chartData);
  const values = Object.values(chartData);

  const ctx = canvas.getContext("2d");

  if(incomeChart){
    incomeChart.destroy();
  }

  incomeChart = new Chart(ctx,{
    type:"line",
    data:{
      labels:labels,
      datasets:[{
        label:"Cash Masuk",
        data:values,
        borderColor:"#3b82f6",
        backgroundColor:"rgba(59,130,246,0.2)",
        tension:0.3,
        fill:true
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{
          labels:{color:"white"}
        }
      },
      scales:{
        x:{ticks:{color:"white"}},
        y:{ticks:{color:"white"}}
      }
    }
  });
}

// ================= RENDER HUTANG =================
function renderHutang(list){

  const container = document.getElementById("hutangList");
  if(!container) return;

  let html = "";

  if(list.length === 0){
    html = "<p>Tidak ada hutang</p>";
  } else {

    list.forEach(item=>{
      html += `
        <div style="margin-bottom:10px;padding:12px;background:#111;border-radius:8px;">
          <b>${item.nama}</b><br>
          Produk: ${item.produk}<br>
          Rp ${item.nominal}<br><br>
          <button onclick="setLunas('${item.id}')" 
                  style="background:#22c55e;border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;">
            Set Lunas
          </button>
        </div>
      `;
    });

  }

  container.innerHTML = html;
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", loadDashboard);

async function tarikLaba(){

  const profit = document.getElementById("totalProfit").innerText;

  if(!profit || Number(profit) <= 0){
    showPopup("Informasi","Ngga ada keuntungan buat di tarik");
    return;
  }

  // Simpan data sementara
  pendingAction = "tarikLaba";
  pendingData = {
    nominal: profit
  };

  // Buka modal PIN
  document.getElementById("pinModal").classList.remove("hidden");
}

function filterProfit(){

  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if(!start || !end){
    showPopup("Informasi","Pilih Tanggal dulu sayang");
    return;
  }

  const filtered = window.lastProfitHistory.filter(item=>{
    return item.tanggal >= start && item.tanggal <= end;
  });

  let total = 0;
  filtered.forEach(item=>{
    total += item.profit;
  });

  document.getElementById("totalProfit").innerText = total;
}

function openTarikTunai(){
  currentAction = "tarikTunai";
  document.getElementById("modal").classList.remove("hidden");
}

function updateChartRange(){

  const range = document.getElementById("rangeSelect").value;

  const now = new Date();
  let fromDate = new Date();

  if(range === "1h") fromDate.setHours(now.getHours() - 1);
  if(range === "12h") fromDate.setHours(now.getHours() - 12);
  if(range === "1d") fromDate.setDate(now.getDate() - 1);
  if(range === "3d") fromDate.setDate(now.getDate() - 3);
  if(range === "7d") fromDate.setDate(now.getDate() - 7);
  if(range === "1m") fromDate.setMonth(now.getMonth() - 1);
  if(range === "3m") fromDate.setMonth(now.getMonth() - 3);

  const filteredCash = fullChartData.cash.filter(d => new Date(d.waktu) >= fromDate);
  const filteredOnline = fullChartData.online.filter(d => new Date(d.waktu) >= fromDate);
  const filteredProfit = fullChartData.profit.filter(d => new Date(d.waktu) >= fromDate);

  renderMultiChart(filteredCash, filteredOnline, filteredProfit);
}

function renderMultiChart(cashData, onlineData, profitData){

  const canvas = document.getElementById("incomeChart");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");

  if(incomeChart){
    incomeChart.destroy();
  }

  incomeChart = new Chart(ctx,{
    type:"line",
    data:{
      labels: cashData.map(d => new Date(d.waktu).toLocaleDateString()),
      datasets:[
        {
          label:"Cash",
          data: cashData.map(d => d.value),
          borderColor:"#22c55e",
          tension:0.4,
          fill:false
        },
        {
          label:"Online",
          data: onlineData.map(d => d.value),
          borderColor:"#3b82f6",
          tension:0.4,
          fill:false
        },
        {
          label:"Profit",
          data: profitData.map(d => d.value),
          borderColor:"#f59e0b",
          tension:0.4,
          fill:false
        }
      ]
    },
    options:{
      responsive:true,
      interaction:{
        mode:"index",
        intersect:false
      },
      plugins:{
        legend:{
          labels:{color:"white"}
        }
      },
      scales:{
        x:{
          ticks:{color:"white"}
        },
        y:{
          ticks:{color:"white"},
          position:"right"
        }
      }
    }
  });
}

function closeSuccess(){
  document.getElementById("successModal").classList.add("hidden");
}

async function sendNotifWA(){

  if(!lastTransactionData || !lastTransactionData.hp){
    showPopup("Error","Data pelanggan tidak ditemukan");
    return;
  }

  // Format pesan lebih rapi & profesional
  const message = 
`Terimakasih, pesanan *${lastTransactionData.produk}* di Anggun Cell sudah berhasil dengan total harga *Rp ${Number(lastTransactionData.harga).toLocaleString()}*.

Pesan ini dikirim otomatis, mohon untuk tidak membalas pesan ini.

⚠️ Hati-hati penipuan!
Anggun Cell tidak pernah meminta OTP, sandi, atau transaksi mencurigakan lainnya selain melalui nomor resmi ini.

Terimakasih atas kepercayaan Anda 🙏`;

  showLoading(); // 🔥 tampilkan loading saat kirim WA

  try{

    const response = await fetch(API,{
      method:"POST",
      body: new URLSearchParams({
        action:"sendWA",
        nomor:lastTransactionData.hp,
        pesan:message
      })
    });

    const result = await response.json();

    hideLoading(); // 🔥 matikan loading dulu

    if(result.status === "wa_sent"){
      
      closeSuccess(); // tutup modal berhasil

      showPopup("Notifikasi Berhasil",
        "Pesan WhatsApp berhasil dikirim ke pelanggan"
      );

    }else{

      showPopup("Gagal",
        "Terjadi kesalahan saat mengirim notifikasi"
      );
    }

  }catch(err){

    hideLoading();

    showPopup("Error",
      "Tidak dapat terhubung ke server"
    );
  }
}


function downloadPDF(){

  const start = document.getElementById("pdfStart").value;
  const end = document.getElementById("pdfEnd").value;

  if(!start || !end){
    showPopup("Informasi","Pilih Rentang Tanggal");
    return;
  }

  const url = API + 
    "?action=downloadPDF" +
    "&start=" + start +
    "&end=" + end;

  window.open(url, "_blank");
}

async function confirmPIN(){

  showLoading();

  try{

    const pin = document.getElementById("pinInput").value;

    const fd = new URLSearchParams();
    fd.append("action", pendingAction);
    fd.append("pin", pin);

    for(const key in pendingData){
      fd.append(key, pendingData[key]);
    }

    const res = await fetch(API,{
      method:"POST",
      body:fd
    });

    const result = await res.json();

    hideLoading();

    if(result.status === "pin_salah"){
      showPopup("PIN Salah","Silakan coba lagi");
      return;
    }

    // 🔥 SIMPAN DATA UNTUK WA
    if(pendingAction === "payout" || pendingAction === "tarikTunai"){
  lastTransactionData = {
    hp: pendingData.hp,
    produk: pendingData.produk,
    harga: pendingData.harga
  };

  document.getElementById("successModal")
    .classList.remove("hidden");
}


// Tutup modal PIN
closePIN();

// 🔥 HANYA UNTUK PAYOUT & TARIK TUNAI
if(pendingAction === "payout" || pendingAction === "tarikTunai"){

  lastTransactionData = {
    hp: pendingData.hp,
    produk: pendingData.produk,
    harga: pendingData.harga
  };

  document.getElementById("successModal")
    .classList.remove("hidden");

} else {

  // Untuk action lain tampilkan popup biasa saja
  showPopup("Berhasil","Transaksi berhasil diproses");
}

loadDashboard();


  }catch(err){

    hideLoading();
    showPopup("Error","Terjadi kesalahan sistem");
  }
}


function closePIN(){
  document.getElementById("pinModal").classList.add("hidden");
}

function showLoading(){
  document.getElementById("loadingScreen").classList.remove("hidden");
}

function hideLoading(){
  document.getElementById("loadingScreen").classList.add("hidden");
}

function showPopup(title,message){

  hideLoading(); // 🔥 pastikan loading mati dulu

  document.getElementById("popupTitle").innerText = title;
  document.getElementById("popupMessage").innerText = message;
  document.getElementById("customPopup").classList.remove("hidden");
}


function closePopup(){
  document.getElementById("customPopup").classList.add("hidden");
}

function toggleMode(){

  const body = document.body;

  body.classList.toggle("light-mode");

  // Simpan preferensi di browser
  if(body.classList.contains("light-mode")){
    localStorage.setItem("theme","light");
  }else{
    localStorage.setItem("theme","dark");
  }
}



