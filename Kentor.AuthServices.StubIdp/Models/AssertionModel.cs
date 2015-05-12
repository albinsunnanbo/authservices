using Kentor.AuthServices.Saml2P;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Configuration;
using System.IdentityModel.Metadata;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Web;
using System.Web.Hosting;

namespace Kentor.AuthServices.StubIdp.Models
{
    public class AssertionModel
    {
        private const string MVK_CGI_Subject_SerialNumber_ClaimType = "Subject_SerialNumber";
        private const string MVK_CGI_Subject_GivenName_ClaimType = "Subject_GivenName";
        private const string MVK_CGI_Subject_Surname_ClaimType = "Subject_Surname";

        [Required]
        [Display(Name = "Assertion Consumer Service Url")]
        public string AssertionConsumerServiceUrl { get; set; }

        [Display(Name = "Subject NameId")]
        public string NameId { get; set; }

        [Display(Name = "Subject SerialNumber (CivicNumber)")]
        public string Subject_SerialNumber { get; set; }

        [Display(Name = "Subject GivenName")]
        public string Subject_GivenName { get; set; }

        [Display(Name = "Subject Surname")]
        public string Subject_Surname { get; set; }

        /// <summary>
        /// Creates a new Assertion model with values from web.config
        /// </summary>
        /// <returns>An <see cref="AssertionModel"/></returns>
        public static AssertionModel CreateFromConfiguration()
        {
            return new AssertionModel
            {
                AssertionConsumerServiceUrl = ConfigurationManager.AppSettings["defaultAcsUrl"],
                NameId = ConfigurationManager.AppSettings["defaultNameId"]
            };
        }

        [Display(Name = "In Response To ID")]
        public string InResponseTo { get; set; }

        public Saml2Response ToSaml2Response()
        {
            var identity = new ClaimsIdentity(new Claim[] {
                new Claim(ClaimTypes.NameIdentifier, NameId ),
                new Claim(MVK_CGI_Subject_SerialNumber_ClaimType, Subject_SerialNumber),
                new Claim(MVK_CGI_Subject_GivenName_ClaimType, Subject_GivenName),
                new Claim(MVK_CGI_Subject_Surname_ClaimType, Subject_Surname),
            }
            );

            return new Saml2Response(
                new EntityId(UrlResolver.MetadataUrl.ToString()),
                CertificateHelper.SigningCertificate, new Uri(AssertionConsumerServiceUrl),
                InResponseTo, identity);
        }

        [Display(Name = "Incoming AuthnRequest")]
        public string AuthnRequestXml { get; set; }
    }
}