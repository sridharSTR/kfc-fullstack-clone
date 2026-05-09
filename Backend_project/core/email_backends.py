import ssl

from django.core.mail.backends.smtp import EmailBackend
from django.utils.functional import cached_property


class GmailDevEmailBackend(EmailBackend):
    @cached_property
    def ssl_context(self):
        return ssl._create_unverified_context()
