# -*- coding: utf-8 -*-

########################################
#
# wildely inspired from :
# http://docs.python.org/howto/logging-cookbook.html#sending-and-receiving-logging-events-across-a-network
# and 
# http://code.activestate.com/recipes/577025-loggingwebmonitor-a-central-logging-server-and-mon/
#
#########################################


import logging
import logging.handlers
import logging.config

import SocketServer
import struct
import cPickle

    
class LogRecordStreamHandler(SocketServer.StreamRequestHandler):
    """Handler for a streaming logging request"""

    def handle(self):
        """
        Handle multiple requests - each expected to be a 4-byte length,
        followed by the LogRecord in pickle format.
        """
        while True:
            chunk = self.connection.recv(4)
            if len(chunk) < 4:
                break
            slen = struct.unpack('>L', chunk)[0]
            chunk = self.connection.recv(slen)
            while len(chunk) < slen:
                chunk = chunk + self.connection.recv(slen - len(chunk))
            obj = self.unPickle(chunk)
            record = logging.makeLogRecord(obj)
            self.handleLogRecord(record)
            
            
    def unPickle(self, data):
        """
        deserialize stream in python object
        """
        return cPickle.loads(data)

    def handleLogRecord(self, record):
        # if a name is specified, we use the named logger rather than the one
        # implied by the record.
        if self.server.logname is not None:
            name = self.server.logname
        else:
            name = record.name
        logger = logging.getLogger(name)

        # N.B. EVERY record gets logged. This is because Logger.handle
        # is normally called AFTER logger-level filtering. If you want
        # to do filtering, do it at the client end to save wasting
        # cycles and network bandwidth!
        logger.handle(record)

     
class LogRecordSocketReceiver(SocketServer.ThreadingTCPServer):
    """
    Simple TCP socket-based logging receiver.
    """

    logname = None
    allow_reuse_address = True
    
    
    def __init__(self, host = 'localhost',
                 port = logging.handlers.DEFAULT_TCP_LOGGING_PORT,
                 handler = LogRecordStreamHandler):
        SocketServer.ThreadingTCPServer.__init__(self, (host, port), handler)
        self.timeout = 1
    