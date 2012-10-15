import unittest
import abc
from abc import ABCMeta
from abc import abstractmethod
from mobyleError import MobyleError


class Data:
    """
    Store and manipulate data. It's composed by two parameters: one data type and one value.
    """

    def __init__( self , data_type = None, value = None):
	'''
	@param data_type: the identifier name of the data type
	@type data_type: string
	@param value: the value associated to the dataType
	@type value: not defined specifically. could be anything.
	'''
	if(not isinstance(data_type, DataType)):
	    msg = "Programming error! Input data type must be an instance of DataType class"
	    raise MobyleError , msg 
        self._data_type = data_type
	self._value = value 


    @property
    def data_type(self):
        """
	@return: the data_type of a Data object.
	@rtype: string
	"""
        return self._data_type


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

    def __init__( self, input_dict = None):
        self._input_struct = input_dict
	
    def __getitem__( self, key):
        return self._input_struct[key]._data_type


class CollectionData():
    
    def __init__( self, list_of_data = None):
	temp_data_type = list_of_data[0].data_type.__class__.__name__
	for data in range( len(list_of_data) ):
	    if(list_of_data[data].data_type.__class__.__name__!=temp_data_type):
		msg = "Programming error! Every entries of the list must have the same data type"
		raise MobyleError , msg 
        self._data_type = temp_data_type

    @property
    def data_type(self):
        """
	@return: the data_type of a Data object.
	@rtype: string
	"""
        return self._data_type



# UNITARY TESTING

class TestDataType(unittest.TestCase):

    def setUp(self):
	self.type_1 = IntegerDataType()
	self.type_2 = StringDataType()

    def test_check_method(self):
        self.assertTrue(self.type_1.check(4))

class TestData(unittest.TestCase):

    def setUp(self):
	type_1 = IntegerDataType()
	type_2 = StringDataType()
	self.nb_of_it = Data(type_1, 3)
	self.filename = Data(type_2, 'toto')

    def test_data_type(self):
        self.assertEqual(self.nb_of_it.data_type.__class__.__name__, 'IntegerDataType')
	self.assertEqual(self.filename.value, 'toto')

class TestStructData(unittest.TestCase):

    def setUp(self):
	type_1 = IntegerDataType()
	type_2 = StringDataType()
	nb_of_it = Data(type_1, 3)
	filename = Data(type_2, 'toto')
	names = ['nb_it', 'file']
	data = [nb_of_it,filename]
	dico = dict(zip(names,data))
	self.structure = StructData(dico)

    def test_value(self):
        self.assertEqual(self.structure['file'].__class__.__name__, 'StringDataType')


class TestCollectionData(unittest.TestCase):

    def setUp(self):
	data_1 = Data(StringDataType(), 'file1')
	data_2 = Data(StringDataType(), 'file2')
	data_3 = Data(StringDataType(), 'file3')
	data_4 = Data(IntegerDataType(), 2)
	list_of_data_1 = [data_1, data_2, data_3]
	list_of_data_2 = [data_1, data_2, data_3, data_4]
	self.my_collection_1 = CollectionData(list_of_data_1)

    
    def test_dataType(self):
        self.assertEqual(self.my_collection_1.data_type, 'StringDataType')


	

if __name__=='__main__':
	unittest.main()

