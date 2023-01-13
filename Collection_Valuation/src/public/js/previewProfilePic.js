var imageInput = document.getElementById("uploadPic")
    var preview = document.getElementById("profile")
    imageInput.addEventListener("change", (event)=>{
        var url = URL.createObjectURL(event.target.files[0])
        preview.setAttribute("src", url)
    })