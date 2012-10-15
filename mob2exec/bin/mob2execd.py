#! /bin/env python
# -*- coding: utf-8 -*-

"""
Created on Aug 13, 2012

@author: Bertrand Néron
@contact: bneron@pasteur.fr
@organization: Institut Pasteur
@license: GPLv3
"""

import os
import sys

MOBYLE_HOME = None
if os.environ.has_key('MOBYLE_HOME'):
    MOBYLE_HOME = os.environ['MOBYLE_HOME']
if not MOBYLE_HOME:
    MOBYLE_HOME = os.path.realpath( os.path.dirname( os.path.dirname(os.path.abspath(__file__))  ))
if MOBYLE_HOME  not in sys.path:
    sys.path.append(MOBYLE_HOME)

#import logging
import logging.config
from conf.logger import server_log_config

import multiprocessing
import threading
import time
import setproctitle

from lib.core.logger import LogRecordSocketReceiver
from lib.execution_engine.jobstable import JobsTable    
from lib.execution_engine.monitor import JtMonitor
from lib.execution_engine.db_manager import DBManager


class Master(object):
    """
    The master is a daemon that start the JtMonitor and the DBManager process. 
    It also keeps all these processes running. If a child process dies, another one is restarted automatically.
    It start a tcp server in a separate thread which is in charge to recieved log emit by child processes and 
    write them on log files.
    """
   
    def __init__(self , pid_file ):
        """
        @param pid_file: the file wher is store the pid of the daemon
        @type pid_file: L{lockfile.pidlockfile.PIDLockFile} instance
        """
        self.pid_file = pid_file
        self.log_receiver = None
        self.log_server_thread = None
        self.jt = None
        self.mon_q = None
        self.jt_monitor = None
        self.db_q = None
        self.db_mgr = None
        
        self._running = False
        
        
    def start(self):
        # can only start a process object created by current process
        # the Queue , DBManager, and Table must be create here instead of __init__
        
        # keep time to daemonize before beginning see comment above
        time.sleep(1)
        self._running = True
        setproctitle.setproctitle('mob2_master')
        self._name = "Master-%d"% os.getpid()
        
        logging.config.dictConfig(server_log_config)
        try:
            self.log_receiver = LogRecordSocketReceiver()
        except Exception ,err:
            msg = str(err) +" : the port used by logger is already in use. Check if an other mob2exec is not already running"
            sys.exit(msg)
        self.log_server_thread = threading.Thread(target=self.log_receiver.serve_forever)   
        self.log_server_thread.start()
        self._log = logging.getLogger(__name__)
        
        self.jt = JobsTable()
        self.mon_q = multiprocessing.Queue()
        self.mon = JtMonitor(self.jt , self.mon_q)
        self.db_q = multiprocessing.Queue()
        self.db_mgr = DBManager( self.jt, self.db_q )
        self.mon.start()
        self.db_mgr.start()
        
        while self._running:
            self._log.debug( "%s is in while %f"%(self._name , time.time()) )
            if not self.mon.is_alive():
                self._log.warning( "%s the Monitor is dead I restart one" % self._name)
                self.mon = JtMonitor( self.jt, self.mon_q )
                self.mon.start()
            if not self.db_mgr.is_alive():
                self._log.warning( "%s the DBManager is dead I restart one" % self._name)
                self.db_mgr = DBManager( self.jt, self.db_q )
                self.db_mgr.start()                
            time.sleep(5)
        self.mon.join()
        
    def stop(self, signum, frame):
        """
        stop DBmanager, monitor and logger properly before exiting
        """
        #print self._name," recieved STOP"
        self._running = False
        cmd = 'STOP'
        self._log.debug( "put %s in monitor Q"%cmd)
        self.mon_q.put(cmd)
        self.mon.join()
        self._log.debug( "put %s in DbManager Q"%cmd)
        self.db_q.put( cmd )
        self.db_mgr.join()
        self._log.debug( "shutdown logger server") 
        self.log_receiver.shutdown()
        self.log_server_thread.join()    
    
    def reload_conf(self, signum, frame):
        print self._name," recieved reload" 
        cmd = 'RELOAD'
        self.mon_q.put(cmd)
        self.db_q.put( cmd )
                  
           
      
if __name__ == '__main__':
    import signal
    import lockfile.pidlockfile
    import daemon
    
    usage = """usage:
    mob2execd {start|stop|reload} """
    lock_file = '/tmp/mob2.pid'  
    
    if len( sys.argv) != 2:
        print >> sys.stderr , usage
        sys.exit(1)
    
    def mob2_pid(lock_file):
        pid = None
        if os.path.exists( lock_file ):
            try:
                f = file( lock_file , 'r')
                pid = int( f.readline() )
                f.close()
            except Exception:
                pass
        return pid
    
    def communicate( pid , signum ): 
        try:    
            os.kill(pid, signum )
        except OSError , err:
            print >> sys.stderr , "%s (pid= %d) not responding: %s" % (sys.argv[0], pid , err)    
             
    cmd = sys.argv[1]
    if cmd == 'start':
        pid = mob2_pid( lock_file )
        if pid:
            print >> sys.stderr,"%s is already running abort this one (pid=%d)" % (lock_file, pid)
            sys.exit(2) 
            
        print "creation du pid_file"
        pid_file = lockfile.pidlockfile.PIDLockFile(lock_file)
        print "instanciation du master"
        
        master = Master( pid_file )
        ############################# DEBUG #################################
        stdout = open('/tmp/mob2.stdout' , 'a')
        stderr = open('/tmp/mob2.stderr' , 'a')
        print "creation du context"
        context = daemon.DaemonContext( pidfile= pid_file, stdout= stdout, stderr= stderr )
        #context = daemon.DaemonContext( pidfile= pid_file )
        ############################## FIN DEBUG ##########################################
        print "configuration du context"
        context.signal_map = {
                          signal.SIGTERM: master.stop ,
                          signal.SIGHUP:  master.reload_conf ,
                          }
        
        print "debut de la demonisation"
        with context :
            master.start()
        print "main EXITING"
        
    elif cmd == 'stop':
        pid = mob2_pid( lock_file )
        if pid:
            communicate( pid , signal.SIGTERM )
        else:
            print >> sys.stderr , "%s is not running " % sys.argv[0]
            sys.exit(3)
    elif cmd == 'reload':
        pid = mob2_pid( lock_file )
        if pid:
            communicate( pid, signal.SIGHUP )
        else:
            sys.exit(3)
    else:
        print >> sys.stderr , usage
        sys.exit(1)

    
