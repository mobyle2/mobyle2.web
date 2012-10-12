from exceptions import Exception

class MobyleError(Exception):

    def __init__(self, msg = None):
        self._message = str( msg )
    
    def _get_message(self):
        return self._message
    #workaround to ensure Mobyle compatibility
    #with either python 2.5 and python 2.6
    #as self.message is deprecated in python 2.6
    message = property( fget = _get_message )
    
    def __str__(self, *args, **kwargs):
        return self.message

