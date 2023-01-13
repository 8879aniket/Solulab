const { ACCESSURL } = require('../../../config/config');

module.exports.email = (data) => `
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
<title>Collection Scanner App</title>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta http-equiv="x-ua-compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="format-detection" content="telephone=no">

<style type="text/css">
  body {
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: 100% !important;
    -ms-text-size-adjust: 100% !important;
    -webkit-font-smoothing: antialiased !important;
  }

  img {
    border: 0 !important;
    outline: none !important;
  }

  p {
    margin: 0 !important;
    padding: 0 !important;
  }

  table {
    border-collapse: collapse;
    mso-table-lspace: 0;
    mso-table-rspace: 0;
  }

  td,
  a,
  span {
    border-collapse: collapse;
    mso-line-height-rule: exactly;
  }

  .ExternalClass * {
    line-height: 100%;
  }

  .defaultlink a {
    color: inherit !important;
    text-decoration: none !important;
  }

  .g_img+div {
    display: none;
  }

  .mcnPreviewText {
    display: none !important;
  }

  .tpl-content {
    padding: 0 !important;
  }

  .black a {
    color: #393c41;
    text-decoration: none;
    font-weight: bold;
  }

  .white a {
    color: #ece2db;
    text-decoration: underline;
  }

  .gray a {
    color: #b2b4b4;
    text-decoration: none;
  }

  .mcnPreviewText {
    display: none !important;
  }

  @media only screen and (min-width:481px) and (max-width:599px) {
    .main_table {
      width: 100% !important;
    }

    .wrapper {
      width: 100% !important;
    }

    .hide {
      display: none !important;
    }

    .full_img {
      width: 100% !important;
      height: auto !important;
    }

    .aside15 {
      padding: 0 15px !important;
    }

    .font {
      font-size: 38px !important;
      line-height: 40px !important;
    }

    .ptop {
      padding-top: 30px !important;
    }

    .pbottom {
      padding-bottom: 30px !important;
    }

    .h20 {
      height: 20px !important;
      font-size: 1px !important;
      line-height: 1px !important;
    }
  }

  @media screen and (max-width: 480px) {
    .main_table {
      width: 100% !important;
    }

    .wrapper {
      width: 100% !important;
    }

    .full_img {
      width: 100% !important;
      height: auto !important;
    }

    .full_img img {
      width: 100% !important;
      height: auto !important;
    }

    .font {
      font-size: 23px !important;
      line-height: 25px !important;
    }

    .ptop {
      padding-top: 30px !important;
    }

    .h20 {
      height: 20px !important;
      font-size: 1px !important;
      line-height: 1px !important;
    }

    .hide {
      display: none !important;
    }

    u+.body .full_wrap {
      width: 100vw !important;
    }


  }
</style>
</head>

<body class="body" style="margin:0px auto; padding:0px;" bgcolor="#f3f3f5">
<!-- == Body Section == -->
<table width="100%" border="0" cellspacing="0" cellpadding="0" class="full_wrap" bgcolor="#f3f3f5">
  <tbody>
    <tr>
      <td align="center" valign="top">
        <!-- == Banner Section == -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" class="full_wrap" bgcolor="#f3f3f5"
          mc:variant="Banner Section">
          <tbody>
            <tr>
              <td align="center" valign="top">
                <table align="center" width="600" border="0" cellspacing="0" cellpadding="0"
                  class="main_table" style="width:600px;table-layout:fixed;">
                  <tbody>
                    <tr>
                      <td height="20">&nbsp;
                      </td>
                    </tr>
                    <!--logo  section-->
                    <!-- first tr end -->
                    <tr>
                      <td align="center" bgcolor="#fff"
                        style="padding: 12px 10px;border: 1px solid #0606ff;">
                        <a href="#!" target="_blank" style="text-decoration: none;">
                          <img src="images/logo-image.png" width="60%"
                            alt="Sunny Lemding llc" style="display: block;">
                        </a>
                      </td>
                    </tr>
                    <!-- secind tr end -->
                    <!--//logo  section-->
                    <tr>
                      <td valign="top" align="center"
                        style="padding:0px 20px;border: 1px solid #0a0aff;" bgcolor="#fff">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0"
                          align="center">
                          <tbody>
                            <tr>
                              <td height="20">&nbsp;</td>
                            </tr>

                            <tr>
                              <td align="left" valign="top"
                                style="background-color: #fff; font-family: Helvetica, Arial, 'sans-serif';line-height:18px; padding-bottom:10px; font-size:14px;">
                                Dear <b>${data.firstName} ${data.lastName},</b>
                              </td>
                            </tr>
                            <tr>
                              <td align="left" valign="top"
                                style="background-color: #fff; font-family: Helvetica, Arial, 'sans-serif';  line-height:20px; font-size:14px;">
                                To verify your email please click on below link.<br><br>
                                <a href="${ACCESSURL}api/v1/verify-email/${data.link}" style="color: #fff; padding: 10px;
                                     background-color: #0101ff; text-decoration: none; "> Click here </a>
                                <br><br><br>
                                <p>Thank you,</p>
                                <p>Team</p>
                                <span
                                  style="color:#006; font-weight:bold;">Collection
                                  Scanner</span>
                              </td>
                            </tr>
                            <tr>
                              <td height="20">&nbsp;</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
</body>
</html>`;
