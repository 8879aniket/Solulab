$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();

  $('input[name="checkbox"]').change(function () {
    var userId = $(this).val();
    if ($(this).is(":checked")) {
      $.ajax({
        url: `${window.location.origin}/admin/block-member/${userId}`,
        type: "PUT",
        success: function (data) {},
        error: function (err) {},
      });
    } else {
      $.ajax({
        url: `${window.location.origin}/admin/block-member/${userId}`,
        type: "PUT",
        success: function (data) {},
        error: function (err) {},
      });
    }
  });

  $("#modal-delete").on("show.bs.modal", function (e) {
    $(this).find(".deleteCoin").attr("href", $(e.relatedTarget).data("href"));
    $(".deleteCoin").on("click", (e) => {
      window.setTimeout(function () {
        window.location.reload();
      }, 1500);
    });
  });
  $("#modal-approve").on("show.bs.modal", function (e) {
    $(this).find(".approveKyc").attr("href", $(e.relatedTarget).data("href"));
    $(".approveKyc").on("click", (e) => {
      window.setTimeout(function () {
        window.location.reload();
      }, 1000);
    });
  });
  $("#modal-delete").on("show.bs.modal", function (e) {
    $(this)
      .find(".deleteAuction")
      .attr("href", $(e.relatedTarget).data("href"));
    $(".deleteAuction").on("click", (e) => {
      window.setTimeout(function () {
        window.location.reload();
      }, 1500);
    });
  });
  $("#modal-delete").on("show.bs.modal", function (e) {
    $(this).find(".deleteCms").attr("href", $(e.relatedTarget).data("href"));
    $(".deleteCms").on("click", (e) => {
      window.setTimeout(function () {
        window.location.reload();
      }, 1500);
    });
  });
  $("#modal-delete").on("show.bs.modal", function (e) {
    $(this)
      .find(".deleteBankNote")
      .attr("href", $(e.relatedTarget).data("href"));
    $(".deleteBankNote").on("click", (e) => {
      window.setTimeout(function () {
        window.location.reload();
      }, 1500);
    });
  });

  $(".dataTables-example").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [1, 3, 4] }],
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
  });
  $(".dataTables-auction").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    fixedColumns: true,
    aoColumnDefs: [
      { bSortable: false, aTargets: [5] },
      // { "width": '20%', "aTargets": [0,1,2,3,4,5,6] },
    ],
  });
  $(".dataTables-kyc").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    fixedColumns: true,
    aoColumnDefs: [
      { bSortable: false, aTargets: [2] },
      // { "width": '20%', "aTargets": [0,1,2,3,4,5,6] },
    ],
  });

  $(".dataTables-example1").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [0, 1, 5] }],
  });
  $(".dataTables-note").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_",
    },
    columnDefs: [{ sortable: false, targets: [0, 2, 8] }],
  });
  $(".dataTables-example-coin").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [5] }],
  });
  $(".dataTables-example-gradedCoin").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [4] }],
  });
  $(".dataTables-example-order").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [0, 5] }],
  });
  $(".dataTables-viewCms").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [0, 2] }],
  });
  $(".dataTables-dispute").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [1, 2, 3] }],
  });
  $(".dataTables-example-3").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [1, 5] }],
  });
  $(".dataTables-bidderDetails").DataTable({
    language: {
      searchPlaceholder: "Search",
      search: "",
      lengthMenu:"Show entries _MENU_"
    },
    aoColumnDefs: [{ bSortable: false, aTargets: [0] }],
  });
  var modal = document.getElementsByClassName("myModal");

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  var img = document.getElementsByClassName("myImg");
  var modalImg = document.getElementsByClassName("img01");
  // var captionText = document.getElementById("caption");
  for (var i = 0; i < img.length; i++) {
    img[i].onclick = function () {
      modal[0].style.display = "block";
      modalImg[0].src = this.src;
      // captionText.innerHTML = this.alt;
    };
  }

  // Get the <span> element that closes the modal
});
function openModal() {
  document.getElementsByClassName("myModal").style.display = "block";
}

function closeModal() {
  document.getElementsByClassName("myModal")[0].style.display = "none";
}
