import unittest
import abc
from abc import ABCMeta
from abc import abstractmethod
from MobyleError import MobyleError


class Data:
    """
    Store and manipulate data. It's composed by two parameters: one data type and one value.
    """
    
    # TO BE REMOVED
    #: keys of all different kind of (simple) data. (EDAM is not yet implemented)
    DATA_TYPES = ['IntegerDataType', 'StringDataType', 'BooleanDataType', 'FloatDataType',
                'ChoiceDataType', 'MultipleChoiceDataType', 'AbstractFileDataType', 'AbstractTextDataType',
                'TextDataType', 'ReportDataType', 'BinaryDataType', 'FilenameDataType']

    def __init__( self , dataType = None, value = None):
	'''
	@param dataType: the identifier name of the data type
	@type dataType: string
	@param value: the value associated to the dataType
	@type value: not defined specifically. could be anything.
	'''
	if(not isinstance(dataType,DataType)):
	    msg = "Bad input format! Input data type must be an instance of DataType class"
	    raise MobyleError , msg 
        self._dataType = dataType
	self._value = value 


    @property
    def dataType(self):
        """
	@return: the dataType of a Data object.
	@rtype: string
	"""
        return self._dataType


    @property
    def value(self):
        """
	@return: the value associated to the dataType.
	@rtype: not defined specifically. could be anything.
	"""
        return self._value


class DataType(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def check( self, value ):
	pass


class SimpleDataType(DataType):
    pass


class IntegerDataType(SimpleDataType):
	
    def check( self, value ):
        return True

class StringDataType(SimpleDataType):

    def check( self, value ):
        return True
	

class StructData(Data):

    def __init__( self, inputDict = None):
        self._inputStruct = inputDict
	
    def __getitem__( self, key):
        return self._inputStruct[key]._dataType


class CollectionData():
    
    def __init__( self, listOfData = None):
	tempDataType = listOfData[0].dataType.__class__.__name__
	for data in range( len(listOfData) ):
	    if(listOfData[data].dataType.__class__.__name__!=tempDataType):
		msg = "Bad input format! Every entries of the list must have the same data type"
		raise MobyleError , msg 
        self._dataType = tempDataType

    @property
    def dataType(self):
        """
	@return: the dataType of a Data object.
	@rtype: string
	"""
        return self._dataType



# UNITARY TESTING

class TestDataType(unittest.TestCase):

    def setUp(self):
	self.type1 = IntegerDataType()
	self.type2 = StringDataType()

    def test_check_method(self):
        self.assertTrue(self.type1.check(4))

class TestData(unittest.TestCase):

    def setUp(self):
	type1 = IntegerDataType()
	type2 = StringDataType()
	self.nb_of_it = Data(type1, 3)
	self.filename = Data(type2, 'toto')

    def test_dataType(self):
        self.assertEqual(self.nb_of_it.dataType.__class__.__name__, 'IntegerDataType')
	self.assertEqual(self.filename.value, 'toto')

class TestStructData(unittest.TestCase):

    def setUp(self):
	type1 = IntegerDataType()
	type2 = StringDataType()
	nb_of_it = Data(type1, 3)
	filename = Data(type2, 'toto')
	names = ['nb_it', 'file']
	data = [nb_of_it,filename]
	dico = dict(zip(names,data))
	self.structure = StructData(dico)

    def test_value(self):
        self.assertEqual(self.structure['file'].__class__.__name__, 'StringDataType')


class TestCollectionData(unittest.TestCase):

    def setUp(self):
	data1 = Data(StringDataType(), 'file1')
	data2 = Data(StringDataType(), 'file2')
	data3 = Data(StringDataType(), 'file3')
	data4 = Data(IntegerDataType(), 2)
	listOfData1 = [data1, data2, data3]
	listOfData2 = [data1, data2, data3, data4]
	self.myCollection1 = CollectionData(listOfData1)

    
    def test_dataType(self):
        self.assertEqual(self.myCollection1.dataType, 'StringDataType')


	

if __name__=='__main__':
	unittest.main()
        
	"""
	print 'Unitary testing'
	print
	
	# Test of DataType class
	print "DataType class test"
	type1 = IntegerDataType()
	type2 = StringDataType()
	
	print "Is '4' an interger? ", type1.check(4)
	print "Remark: return always True"
	print
	
	# Test of Data class
	print "Data class test"
	nb_of_it = Data(type1, 3)
	filename = Data(type2, 'toto')
	
	print "Test access to the class attributes!"
	print "nb_of_it.dataType: " , nb_of_it.dataType
	print "filename.value: " , filename.value
	print
	
	# Test of StructData class
	print "StructData class test"
	names = ['nb_it', 'file']
	data = [nb_of_it,filename]
	dico = dict(zip(names,data))
	
	structure = StructData(dico)
	print "structure['file'] " , structure['file']
	print
	
	# Test of CollectionData class
	print "CollectionData class test"
	data1 = Data(StringDataType(), 'file1')
	data2 = Data(StringDataType(), 'file2')
	data3 = Data(StringDataType(), 'file3')
	data4 = Data(IntegerDataType(), 2)

	listOfString = [data1, data2, data3]
	myCollection = CollectionData(listOfString)
	print "myCollection data type is: ", myCollection.dataType
	"""
	
	